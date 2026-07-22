/**
 * Admin LINE broadcast: filter recipients, multicast, and audit logs.
 */

import {
  Timestamp,
  getFirestore,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { multicastMessages } from "../line/client";
import { textMessage } from "../line/messages";
import type { MemberType } from "../members/membership";
import {
  MEMBERS_COLLECTION,
  findMemberById,
} from "../members/repository";
import type { MemberDoc, MemberStatus } from "../members/types";

export const BROADCAST_LOGS_COLLECTION = "broadcastLogs";

const PAGE_SIZE = 200;
const MULTICAST_CHUNK = 150;
const MAX_MESSAGE_CHARS = 4500;

export type BroadcastFilters = {
  memberTypes?: MemberType[];
  statuses?: MemberStatus[];
  boardOnly?: boolean;
};

export type BroadcastRecipient = {
  memberId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  memberType?: MemberType;
  memberTypeLabel?: string;
  status: MemberStatus;
  isBoardMember?: boolean;
  hasLine: boolean;
  lineUserId?: string;
};

export type ListBroadcastRecipientsResult = {
  recipients: BroadcastRecipient[];
  skippedNoLine: number;
  totalMatched: number;
};

export type SendBroadcastOpts = {
  message: string;
  selectAll?: boolean;
  filters?: BroadcastFilters;
  memberIds?: string[];
  actorEmail: string;
};

export type SendBroadcastResult =
  | {
      ok: true;
      sent: number;
      failed: number;
      skipped: number;
      logId: string;
    }
  | { ok: false; error: string; status: number };

export type BroadcastLogItem = {
  logId: string;
  message: string;
  selectAll: boolean;
  filters?: BroadcastFilters;
  memberIds?: string[];
  sent: number;
  failed: number;
  skipped: number;
  recipientCount: number;
  createdBy: string;
  createdAt: string;
};

function matchesFilters(m: MemberDoc, filters: BroadcastFilters): boolean {
  const types = filters.memberTypes;
  if (types && types.length > 0) {
    if (!m.memberType || !types.includes(m.memberType)) return false;
  }

  const statuses = filters.statuses;
  if (statuses && statuses.length > 0) {
    if (!statuses.includes(m.status)) return false;
  }

  if (filters.boardOnly) {
    if (m.isBoardMember !== true) return false;
  }

  return true;
}

function toRecipient(m: MemberDoc): BroadcastRecipient {
  const firstName = m.firstName ?? "";
  const lastName = m.lastName ?? "";
  const lineUserId = m.lineUserId?.trim() || undefined;
  return {
    memberId: m.memberId,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    phone: m.phone,
    memberType: m.memberType,
    memberTypeLabel: m.memberTypeLabel,
    status: m.status,
    isBoardMember: m.isBoardMember,
    hasLine: Boolean(lineUserId),
    lineUserId,
  };
}

async function scanMatchingMembers(
  filters: BroadcastFilters,
): Promise<BroadcastRecipient[]> {
  const db = getFirestore();
  const matched: BroadcastRecipient[] = [];
  let lastDoc: QueryDocumentSnapshot | undefined;

  for (;;) {
    let query = db
      .collection(MEMBERS_COLLECTION)
      .orderBy("__name__")
      .limit(PAGE_SIZE);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snap = await query.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const m = doc.data() as MemberDoc;
      if (!matchesFilters(m, filters)) continue;
      matched.push(toRecipient(m));
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE_SIZE) break;
  }

  return matched;
}

export async function listBroadcastRecipients(
  filters: BroadcastFilters = {},
): Promise<ListBroadcastRecipientsResult> {
  const matched = await scanMatchingMembers(filters);
  const withLine = matched.filter((r) => r.hasLine && r.lineUserId);
  const skippedNoLine = matched.length - withLine.length;
  // Do not expose LINE user IDs to the admin UI response.
  return {
    recipients: withLine.map(({ lineUserId: _omit, ...rest }) => rest),
    skippedNoLine,
    totalMatched: matched.length,
  };
}

async function resolveSelectableTargets(
  filters: BroadcastFilters,
): Promise<{ targets: { memberId: string; lineUserId: string }[]; skippedNoLine: number }> {
  const matched = await scanMatchingMembers(filters);
  const targets = matched
    .filter((r) => r.lineUserId)
    .map((r) => ({ memberId: r.memberId, lineUserId: r.lineUserId! }));
  return {
    targets,
    skippedNoLine: matched.length - targets.length,
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function sendBroadcast(
  opts: SendBroadcastOpts,
): Promise<SendBroadcastResult> {
  const message = opts.message.trim();
  if (!message) {
    return { ok: false, error: "message_required", status: 400 };
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return { ok: false, error: "message_too_long", status: 400 };
  }

  let lineTargets: { memberId: string; lineUserId: string }[] = [];
  let skipped = 0;
  const filters = opts.filters ?? {};

  if (opts.selectAll) {
    const resolved = await resolveSelectableTargets(filters);
    lineTargets = resolved.targets;
    skipped = resolved.skippedNoLine;
  } else {
    const ids = (opts.memberIds ?? [])
      .map((id) => String(id).trim())
      .filter(Boolean);
    if (ids.length === 0) {
      return { ok: false, error: "member_ids_required", status: 400 };
    }

    for (const memberId of ids) {
      const m = await findMemberById(memberId);
      if (!m) {
        skipped += 1;
        continue;
      }
      const lineUserId = m.lineUserId?.trim();
      if (!lineUserId) {
        skipped += 1;
        continue;
      }
      lineTargets.push({ memberId: m.memberId, lineUserId });
    }
  }

  const uniqueByLine = new Map<string, string>();
  for (const t of lineTargets) {
    if (!uniqueByLine.has(t.lineUserId)) {
      uniqueByLine.set(t.lineUserId, t.memberId);
    }
  }
  const lineUserIds = [...uniqueByLine.keys()];

  let sent = 0;
  let failed = 0;
  const payload = [textMessage(message)];

  for (const chunk of chunkArray(lineUserIds, MULTICAST_CHUNK)) {
    const ok = await multicastMessages(chunk, payload);
    if (ok) sent += chunk.length;
    else failed += chunk.length;
  }

  const logRef = getFirestore().collection(BROADCAST_LOGS_COLLECTION).doc();
  const createdAt = Timestamp.now();
  await logRef.set({
    message,
    selectAll: Boolean(opts.selectAll),
    filters: opts.selectAll ? filters : undefined,
    memberIds: opts.selectAll ? undefined : (opts.memberIds ?? []),
    sent,
    failed,
    skipped,
    recipientCount: lineUserIds.length,
    createdBy: opts.actorEmail,
    createdAt,
  });

  return {
    ok: true,
    sent,
    failed,
    skipped,
    logId: logRef.id,
  };
}

export async function listBroadcastLogs(
  limit = 20,
): Promise<BroadcastLogItem[]> {
  const capped = Math.min(Math.max(limit, 1), 100);
  const snap = await getFirestore()
    .collection(BROADCAST_LOGS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(capped)
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    const createdAt =
      typeof d.createdAt?.toDate === "function"
        ? (d.createdAt as Timestamp).toDate().toISOString()
        : "";
    return {
      logId: doc.id,
      message: String(d.message ?? ""),
      selectAll: Boolean(d.selectAll),
      filters: d.filters as BroadcastFilters | undefined,
      memberIds: Array.isArray(d.memberIds)
        ? (d.memberIds as string[])
        : undefined,
      sent: Number(d.sent ?? 0),
      failed: Number(d.failed ?? 0),
      skipped: Number(d.skipped ?? 0),
      recipientCount: Number(d.recipientCount ?? 0),
      createdBy: String(d.createdBy ?? ""),
      createdAt,
    };
  });
}

const KNOWN_MEMBER_TYPES = new Set<MemberType>([
  "ordinary",
  "extraordinary",
  "honorary",
  "other",
]);

const KNOWN_MEMBER_STATUSES = new Set<MemberStatus>([
  "registered",
  "pending_review",
  "temporary",
  "active",
  "near_expiry",
  "expired",
]);

function parseCommaList(raw: unknown): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBoardOnly(raw: unknown): boolean {
  if (raw === true || raw === 1) return true;
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  return s === "1" || s === "true";
}

/** Parse query/body filter params (comma-separated memberTypes & statuses). */
export function filtersFromQuery(query: {
  memberTypes?: unknown;
  statuses?: unknown;
  boardOnly?: unknown;
}): BroadcastFilters {
  const memberTypes = parseCommaList(query.memberTypes).filter(
    (t): t is MemberType => KNOWN_MEMBER_TYPES.has(t as MemberType),
  );
  const statuses = parseCommaList(query.statuses).filter((s): s is MemberStatus =>
    KNOWN_MEMBER_STATUSES.has(s as MemberStatus),
  );
  const boardOnly = parseBoardOnly(query.boardOnly);
  return {
    memberTypes: memberTypes.length > 0 ? memberTypes : undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
    boardOnly: boardOnly || undefined,
  };
}

/** Parse JSON body filters (arrays or comma-separated strings). */
export function filtersFromBody(body: Record<string, unknown>): BroadcastFilters {
  const typesRaw = body.memberTypes;
  const statusesRaw = body.statuses;
  const memberTypes = Array.isArray(typesRaw)
    ? typesRaw
        .map((t) => String(t).trim())
        .filter((t): t is MemberType => KNOWN_MEMBER_TYPES.has(t as MemberType))
    : parseCommaList(typesRaw).filter((t): t is MemberType =>
        KNOWN_MEMBER_TYPES.has(t as MemberType),
      );
  const statuses = Array.isArray(statusesRaw)
    ? statusesRaw
        .map((s) => String(s).trim())
        .filter((s): s is MemberStatus =>
          KNOWN_MEMBER_STATUSES.has(s as MemberStatus),
        )
    : parseCommaList(statusesRaw).filter((s): s is MemberStatus =>
        KNOWN_MEMBER_STATUSES.has(s as MemberStatus),
      );
  const boardOnly = parseBoardOnly(body.boardOnly);
  return {
    memberTypes: memberTypes.length > 0 ? memberTypes : undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
    boardOnly: boardOnly || undefined,
  };
}
