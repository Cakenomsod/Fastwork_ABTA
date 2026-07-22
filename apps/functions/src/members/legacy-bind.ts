/**
 * Legacy member search + LINE bind (Phase B).
 * No slip required — identity verification against legacyMembers.
 */

import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { WEB_ORIGIN, getLoginChannelId } from "../config";
import { verifyLineIdToken } from "../line/verify-id-token";
import { pushMessages } from "../line/client";
import { legacyBindSuccessText } from "../line/messages";
import {
  findLegacyMemberById,
  findLegacyMembersByIdentity,
  isLegacyMemberBound,
} from "../legacy/repository";
import type { LegacyMemberDoc, LegacyMemberStatus } from "../legacy/types";
import { writeMemberRegistryInTx } from "./id-registry";
import { allocatePermanentMemberId } from "./ids";
import { resolvePublicToken } from "./public-token";
import {
  MEMBERS_COLLECTION,
  findMemberByLineUserId,
} from "./repository";
import {
  MEMBER_TYPE_LABEL,
  applyExpiryToMemberStatus,
  type MemberType,
} from "./membership";
import type { MemberDoc, MemberStatus } from "./types";

export type LegacySearchResult =
  | {
      ok: true;
      matches: Array<{
        legacyMemberId: string;
        fullName: string;
        legalEntityName?: string;
        buildingName?: string;
        status: LegacyMemberStatus;
        statusLabel: string;
        memberTypeLabel?: string;
        expiryDate?: string;
      }>;
    }
  | { ok: false; error: string; status: number };

export type LegacyBindResult =
  | {
      ok: true;
      memberId: string;
      legacyMemberId: string;
      publicToken: string;
      statusUrl: string;
      memberCardUrl: string;
      status: MemberStatus;
    }
  | { ok: false; error: string; status: number };

async function verifyLineUser(idToken: string): Promise<
  | { ok: true; lineUserId: string }
  | { ok: false; error: string; status: number }
> {
  const loginChannelId = getLoginChannelId();
  if (!loginChannelId) {
    return { ok: false, error: "server_misconfigured", status: 503 };
  }
  try {
    const verified = await verifyLineIdToken(idToken.trim(), loginChannelId);
    if (!verified.userId) {
      return { ok: false, error: "invalid_id_token", status: 401 };
    }
    return { ok: true, lineUserId: verified.userId };
  } catch (err) {
    console.warn("LINE ID token verify failed", err);
    return { ok: false, error: "invalid_id_token", status: 401 };
  }
}

function statusLabel(status: LegacyMemberStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "expired":
      return "Expired";
    case "non_active":
      return "NonActive";
    default:
      return "Pending";
  }
}

function toPublicMatch(legacy: LegacyMemberDoc) {
  return {
    legacyMemberId: legacy.legacyMemberId,
    fullName: `${legacy.firstName} ${legacy.lastName}`.trim(),
    legalEntityName: legacy.legalEntityName,
    buildingName: legacy.buildingName ?? legacy.organization,
    status: legacy.status,
    statusLabel: statusLabel(legacy.status),
    memberTypeLabel: legacy.memberTypeLabel,
    expiryDate: legacy.expiryDate?.toDate?.()?.toISOString?.()?.slice(0, 10),
  };
}

function mapLegacyStatusToMember(legacy: LegacyMemberDoc): MemberStatus {
  if (legacy.status === "pending" || legacy.status === "non_active") {
    return "pending_review";
  }
  if (legacy.status === "expired") return "expired";
  const expiry = legacy.expiryDate?.toDate?.();
  const base: MemberStatus = "active";
  return applyExpiryToMemberStatus(base, expiry);
}

function resolveMemberType(legacy: LegacyMemberDoc): {
  memberType: MemberType;
  memberTypeLabel: string;
} {
  const memberType = legacy.memberType ?? "ordinary";
  return {
    memberType,
    memberTypeLabel:
      legacy.memberTypeLabel?.trim() || MEMBER_TYPE_LABEL[memberType],
  };
}

export async function searchLegacyMembers(input: {
  idToken: string;
  firstName: string;
  lastName: string;
  legalEntityName?: string;
  buildingName?: string;
}): Promise<LegacySearchResult> {
  const verified = await verifyLineUser(input.idToken);
  if (!verified.ok) return verified;

  const existing = await findMemberByLineUserId(verified.lineUserId);
  if (existing) {
    return { ok: false, error: "already_registered", status: 409 };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) {
    return { ok: false, error: "required_fields_missing", status: 400 };
  }

  const matches = await findLegacyMembersByIdentity({
    firstName,
    lastName,
    legalEntityName: input.legalEntityName?.trim(),
    buildingName: input.buildingName?.trim(),
  });

  return {
    ok: true,
    matches: matches.map(toPublicMatch),
  };
}

export async function bindLegacyMember(input: {
  idToken: string;
  legacyMemberId: string;
  firstName: string;
  lastName: string;
  legalEntityName?: string;
  buildingName?: string;
}): Promise<LegacyBindResult> {
  const verified = await verifyLineUser(input.idToken);
  if (!verified.ok) return verified;

  const existing = await findMemberByLineUserId(verified.lineUserId);
  if (existing) {
    return { ok: false, error: "already_registered", status: 409 };
  }

  const legacyMemberId = input.legacyMemberId.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!legacyMemberId) {
    return { ok: false, error: "legacy_member_id_required", status: 400 };
  }
  if (!firstName || !lastName) {
    return { ok: false, error: "required_fields_missing", status: 400 };
  }

  const legacy = await findLegacyMemberById(legacyMemberId);
  if (!legacy) {
    return { ok: false, error: "legacy_not_found", status: 404 };
  }

  const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();
  if (
    norm(legacy.firstName) !== norm(firstName) ||
    norm(legacy.lastName) !== norm(lastName)
  ) {
    return { ok: false, error: "identity_mismatch", status: 403 };
  }
  const legal = input.legalEntityName?.trim();
  if (legal && legacy.legalEntityName && norm(legacy.legalEntityName) !== norm(legal)) {
    return { ok: false, error: "identity_mismatch", status: 403 };
  }
  const building = input.buildingName?.trim();
  if (
    building &&
    (legacy.buildingName || legacy.organization) &&
    norm(legacy.buildingName || legacy.organization) !== norm(building)
  ) {
    return { ok: false, error: "identity_mismatch", status: 403 };
  }

  if (legacy.status === "pending") {
    return { ok: false, error: "legacy_pending", status: 409 };
  }

  if (await isLegacyMemberBound(legacyMemberId)) {
    return { ok: false, error: "legacy_already_bound", status: 409 };
  }

  const memberId = await allocatePermanentMemberId();
  const token = resolvePublicToken();
  const now = Timestamp.now();
  const status = mapLegacyStatusToMember(legacy);
  const { memberType, memberTypeLabel } = resolveMemberType(legacy);
  const memberCardUrl = `${WEB_ORIGIN}/card?m=${encodeURIComponent(memberId)}&t=${token}`;
  const statusUrl = `${WEB_ORIGIN}/status?m=${encodeURIComponent(memberId)}&t=${token}`;

  const member: MemberDoc = {
    memberId,
    legacyMemberId,
    firstName: legacy.firstName,
    lastName: legacy.lastName,
    legalEntityName: legacy.legalEntityName,
    buildingName: legacy.buildingName,
    organization: legacy.organization ?? legacy.buildingName,
    phone: legacy.phone,
    email: legacy.email,
    lineUserId: verified.lineUserId,
    lineLinkedAt: now,
    linkType: "legacy_bind",
    status,
    memberType,
    memberTypeLabel,
    memberCardUrl,
    expiryDate: legacy.expiryDate,
    dataReviewStatus: "approved",
    seminarStatus: "none",
    publicToken: token,
    createdAt: now,
    updatedAt: now,
  };

  const db = getFirestore();
  const memberRef = db.collection(MEMBERS_COLLECTION).doc(memberId);

  await db.runTransaction(async (tx) => {
    const clash = await tx.get(memberRef);
    if (clash.exists) {
      const err = new Error("member_id_taken");
      (err as Error & { code: string }).code = "member_id_taken";
      throw err;
    }
    tx.set(memberRef, member);
    writeMemberRegistryInTx(tx, memberId, "legacy_bind");
  });

  try {
    await pushMessages(verified.lineUserId, [
      legacyBindSuccessText({
        fullName: `${legacy.firstName} ${legacy.lastName}`.trim(),
        memberId,
        legacyMemberId,
        statusUrl,
      }),
    ]);
  } catch (err) {
    console.error("LINE notify legacy bind failed", err);
  }

  return {
    ok: true,
    memberId,
    legacyMemberId,
    publicToken: token,
    statusUrl,
    memberCardUrl,
    status,
  };
}
