import { Timestamp, getFirestore } from "firebase-admin/firestore";
import {
  SEMINARS_COLLECTION,
  SEMINAR_REGISTRATIONS_COLLECTION,
  type SeminarDoc,
  type SeminarRegistrationDoc,
} from "./types";

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
