/**
 * Admin-created member records (no LINE / slip required).
 */

import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { WEB_ORIGIN } from "../config";
import { allocatePermanentMemberId } from "../members/ids";
import {
  MEMBER_TYPE_LABEL,
  applyExpiryToMemberStatus,
  membershipExpiryDec31,
  normalizeMemberType,
  type MemberType,
} from "../members/membership";
import { resolvePublicToken } from "../members/public-token";
import { MEMBERS_COLLECTION } from "../members/repository";
import { getAdminMemberDetail, type MemberDetail } from "./reviews";

function optionalTrim(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function parseExpiry(raw: string | undefined): Date | { error: string } {
  const t = raw?.trim();
  if (!t) return membershipExpiryDec31(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return { error: "invalid_expiry_date" };
  }
  const [y, m, d] = t.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return { error: "invalid_expiry_date" };
  }
  return date;
}

function parseTags(raw: unknown): string[] | undefined {
  const list = Array.isArray(raw)
    ? raw.map((t) => String(t))
    : typeof raw === "string"
      ? raw.split(/[,，\n]/)
      : [];
  const tags = [
    ...new Set(
      list
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 30),
    ),
  ];
  if (tags.some((t) => t.length > 40)) return undefined;
  return tags;
}

export type CreateMemberInput = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  legalEntityName?: string;
  buildingName?: string;
  organization?: string;
  memberType?: string;
  expiryDate?: string;
  isBoardMember?: boolean;
  tags?: unknown;
};

export async function createMemberFromAdmin(opts: {
  input: CreateMemberInput;
  actorEmail: string;
}): Promise<
  | { ok: true; memberId: string; member: MemberDetail }
  | { ok: false; error: string; status: number }
> {
  const firstName = opts.input.firstName.trim();
  const lastName = opts.input.lastName.trim();
  if (!firstName || !lastName) {
    return { ok: false, error: "required_fields_missing", status: 400 };
  }

  const phoneDigits = (opts.input.phone ?? "").replace(/\D/g, "");
  if (phoneDigits && !/^0\d{9}$/.test(phoneDigits)) {
    return { ok: false, error: "invalid_phone", status: 400 };
  }

  const expiry = parseExpiry(opts.input.expiryDate);
  if ("error" in expiry) {
    return { ok: false, error: expiry.error, status: 400 };
  }

  const memberType: MemberType =
    normalizeMemberType(opts.input.memberType) ?? "ordinary";
  const tags = parseTags(opts.input.tags);
  if (opts.input.tags != null && tags === undefined) {
    return { ok: false, error: "tag_too_long", status: 400 };
  }

  const now = new Date();
  const memberId = await allocatePermanentMemberId(now);
  const token = resolvePublicToken();
  const ts = Timestamp.fromDate(now);
  const expiryTs = Timestamp.fromDate(expiry);
  const status = applyExpiryToMemberStatus("active", expiry, now);
  const buildingName = optionalTrim(opts.input.buildingName);
  const legalEntityName = optionalTrim(opts.input.legalEntityName);
  const organization =
    optionalTrim(opts.input.organization) ?? buildingName;
  const email = optionalTrim(opts.input.email);
  const memberCardUrl = `${WEB_ORIGIN}/card?m=${encodeURIComponent(memberId)}&t=${token}`;

  const member = omitUndefined({
    memberId,
    firstName,
    lastName,
    legalEntityName,
    buildingName,
    organization,
    phone: phoneDigits || undefined,
    email,
    linkType: "new_registration",
    status,
    memberType,
    memberTypeLabel: MEMBER_TYPE_LABEL[memberType],
    isBoardMember: opts.input.isBoardMember ? true : undefined,
    tags: tags && tags.length ? tags : undefined,
    memberCardUrl,
    expiryDate: expiryTs,
    dataReviewStatus: "approved",
    seminarStatus: "none",
    publicToken: token,
    createdByEmail: opts.actorEmail,
    createdAt: ts,
    updatedAt: ts,
  });

  await getFirestore()
    .collection(MEMBERS_COLLECTION)
    .doc(memberId)
    .set({
      ...member,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  const detail = await getAdminMemberDetail(memberId);
  if (!detail) {
    return { ok: false, error: "create_failed", status: 500 };
  }
  return { ok: true, memberId, member: detail };
}
