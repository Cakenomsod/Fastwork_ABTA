/**
 * Editable LINE broadcast templates (e.g. AGM invite).
 */

import { Timestamp, getFirestore } from "firebase-admin/firestore";

export const MESSAGE_TEMPLATES_COLLECTION = "messageTemplates";

export const AGM_INVITE_TEMPLATE_ID = "agm_invite";

export const DEFAULT_AGM_INVITE_BODY = [
  "เรียน สมาชิกสามัญ สมาคมการค้าผู้ประกอบการธุรกิจห้องเช่า (ABTA)",
  "",
  "ขอเรียนเชิญท่านเข้าร่วมประชุมใหญ่สามัญประจำปี",
  "ในช่วงประมาณเดือนเมษายน",
  "",
  "รายละเอียดวันเวลา สถานที่ และวาระการประชุม",
  "จะแจ้งให้ทราบอีกครั้งครับ",
  "",
  "ด้วยความเคารพ",
  "เลขาธิการสมาคม",
].join("\n");

export type MessageTemplate = {
  id: string;
  title: string;
  body: string;
  updatedBy?: string;
  updatedAt?: string;
};

type TemplateDoc = {
  title?: string;
  body?: string;
  updatedBy?: string;
  updatedAt?: Timestamp;
};

function toTemplate(id: string, data: TemplateDoc | undefined): MessageTemplate {
  if (id === AGM_INVITE_TEMPLATE_ID) {
    return {
      id,
      title: data?.title?.trim() || "เชิญประชุมใหญ่สามัญประจำปี",
      body: data?.body?.trim() || DEFAULT_AGM_INVITE_BODY,
      updatedBy: data?.updatedBy,
      updatedAt:
        typeof data?.updatedAt?.toDate === "function"
          ? data.updatedAt.toDate().toISOString()
          : undefined,
    };
  }
  return {
    id,
    title: data?.title?.trim() || id,
    body: data?.body?.trim() || "",
    updatedBy: data?.updatedBy,
    updatedAt:
      typeof data?.updatedAt?.toDate === "function"
        ? data.updatedAt.toDate().toISOString()
        : undefined,
  };
}

export async function getMessageTemplate(
  id: string,
): Promise<MessageTemplate> {
  const snap = await getFirestore()
    .collection(MESSAGE_TEMPLATES_COLLECTION)
    .doc(id)
    .get();
  return toTemplate(id, snap.exists ? (snap.data() as TemplateDoc) : undefined);
}

export async function listMessageTemplates(): Promise<MessageTemplate[]> {
  const agm = await getMessageTemplate(AGM_INVITE_TEMPLATE_ID);
  return [agm];
}

export async function upsertMessageTemplate(opts: {
  id: string;
  title?: string;
  body: string;
  actorEmail: string;
}): Promise<MessageTemplate> {
  const id = opts.id.trim();
  if (!id) {
    throw Object.assign(new Error("template_id_required"), { status: 400 });
  }
  const body = opts.body.trim();
  if (!body) {
    throw Object.assign(new Error("body_required"), { status: 400 });
  }
  if (body.length > 4500) {
    throw Object.assign(new Error("body_too_long"), { status: 400 });
  }

  const title =
    opts.title?.trim() ||
    (id === AGM_INVITE_TEMPLATE_ID
      ? "เชิญประชุมใหญ่สามัญประจำปี"
      : id);

  const now = Timestamp.now();
  await getFirestore()
    .collection(MESSAGE_TEMPLATES_COLLECTION)
    .doc(id)
    .set(
      {
        title,
        body,
        updatedBy: opts.actorEmail,
        updatedAt: now,
      },
      { merge: true },
    );

  return {
    id,
    title,
    body,
    updatedBy: opts.actorEmail,
    updatedAt: now.toDate().toISOString(),
  };
}
