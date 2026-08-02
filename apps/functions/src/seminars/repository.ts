import { Timestamp, getFirestore } from "firebase-admin/firestore";
import {
  SEMINARS_COLLECTION,
  SEMINAR_REGISTRATIONS_COLLECTION,
  type SeminarDoc,
  type SeminarRegistrationDoc,
  type SeminarRegistrationStatus,
} from "./types";

const ACTIVE_REG_STATUSES: SeminarRegistrationStatus[] = [
  "registered",
  "paid",
  "confirmed",
];

/**
 * Find a non-rejected registration for the same seminar + identity.
 * Prefer lineUserId, then memberId, then phone.
 * Filters in memory to avoid requiring new composite indexes.
 */
export async function findActiveRegistration(input: {
  seminarId: string;
  lineUserId?: string;
  memberId?: string;
  phone?: string;
}): Promise<SeminarRegistrationDoc | undefined> {
  const seminarId = input.seminarId.trim();
  if (!seminarId) return undefined;

  const snap = await getFirestore()
    .collection(SEMINAR_REGISTRATIONS_COLLECTION)
    .where("seminarId", "==", seminarId)
    .limit(200)
    .get();

  const rows = snap.docs
    .map((d) => d.data() as SeminarRegistrationDoc)
    .filter((r) => ACTIVE_REG_STATUSES.includes(r.status));

  const lineUserId = input.lineUserId?.trim();
  if (lineUserId) {
    const hit = rows.find((r) => r.lineUserId === lineUserId);
    if (hit) return hit;
  }
  const memberId = input.memberId?.trim();
  if (memberId) {
    const hit = rows.find((r) => r.memberId === memberId);
    if (hit) return hit;
  }
  const phone = input.phone?.trim();
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, "");
    const hit = rows.find(
      (r) => (r.phone ?? "").replace(/\D/g, "") === phoneDigits,
    );
    if (hit) return hit;
  }
  return undefined;
}

export async function listActiveSeminars(): Promise<SeminarDoc[]> {
  const snap = await getFirestore()
    .collection(SEMINARS_COLLECTION)
    .where("active", "==", true)
    .get();
  return snap.docs.map((d) => d.data() as SeminarDoc);
}

export async function listAllSeminars(): Promise<SeminarDoc[]> {
  const snap = await getFirestore().collection(SEMINARS_COLLECTION).get();
  return snap.docs
    .map((d) => d.data() as SeminarDoc)
    .sort((a, b) => (b.eventDate ?? "").localeCompare(a.eventDate ?? ""));
}

export async function getSeminar(
  seminarId: string,
): Promise<SeminarDoc | undefined> {
  const snap = await getFirestore()
    .collection(SEMINARS_COLLECTION)
    .doc(seminarId)
    .get();
  return snap.exists ? (snap.data() as SeminarDoc) : undefined;
}

export async function upsertSeminar(
  seminar: SeminarDoc,
): Promise<void> {
  const now = Timestamp.now();
  await getFirestore()
    .collection(SEMINARS_COLLECTION)
    .doc(seminar.seminarId)
    .set(
      {
        ...seminar,
        updatedAt: now,
        createdAt: seminar.createdAt ?? now,
      },
      { merge: true },
    );
}

export async function listRegistrations(
  seminarId?: string,
): Promise<SeminarRegistrationDoc[]> {
  const snap = seminarId
    ? await getFirestore()
        .collection(SEMINAR_REGISTRATIONS_COLLECTION)
        .where("seminarId", "==", seminarId)
        .limit(100)
        .get()
    : await getFirestore()
        .collection(SEMINAR_REGISTRATIONS_COLLECTION)
        .limit(100)
        .get();
  return snap.docs
    .map((d) => d.data() as SeminarRegistrationDoc)
    .sort(
      (a, b) =>
        (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
    );
}

export async function getRegistration(
  registrationId: string,
): Promise<SeminarRegistrationDoc | undefined> {
  const snap = await getFirestore()
    .collection(SEMINAR_REGISTRATIONS_COLLECTION)
    .doc(registrationId)
    .get();
  return snap.exists ? (snap.data() as SeminarRegistrationDoc) : undefined;
}

export async function saveRegistration(
  reg: SeminarRegistrationDoc,
): Promise<void> {
  await getFirestore()
    .collection(SEMINAR_REGISTRATIONS_COLLECTION)
    .doc(reg.registrationId)
    .set(reg, { merge: true });
}
