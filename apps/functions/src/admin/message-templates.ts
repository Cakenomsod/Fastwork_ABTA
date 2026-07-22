/**
 * Editable LINE broadcast templates (e.g. AGM invite + custom templates).
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

function sortTemplates(list: MessageTemplate[]): MessageTemplate[] {
  return [...list].sort((a, b) => {
    if (a.id === AGM_INVITE_TEMPLATE_ID) return -1;
    if (b.id === AGM_INVITE_TEMPLATE_ID) return 1;
    const at = a.updatedAt ?? "";
    const bt = b.updatedAt ?? "";
    if (at !== bt) return bt.localeCompare(at);
    return a.title.localeCompare(b.title, "th");
  });
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

/** List every saved template; always include seeded AGM invite. */
export async function listMessageTemplates(): Promise<MessageTemplate[]> {
  const snap = await getFirestore()
    .collection(MESSAGE_TEMPLATES_COLLECTION)
    .get();

  const byId = new Map<string, MessageTemplate>();
  for (const doc of snap.docs) {
    byId.set(doc.id, toTemplate(doc.id, doc.data() as TemplateDoc));
  }

  if (!byId.has(AGM_INVITE_TEMPLATE_ID)) {
    byId.set(
      AGM_INVITE_TEMPLATE_ID,
      toTemplate(AGM_INVITE_TEMPLATE_ID, undefined),
    );
  }

  return sortTemplates([...byId.values()]);
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

/** Create a new template with a generated Firestore id. */
export async function createMessageTemplate(opts: {
  title: string;
  body: string;
  actorEmail: string;
}): Promise<MessageTemplate> {
  const title = opts.title.trim();
  if (!title) {
    throw Object.assign(new Error("title_required"), { status: 400 });
  }
  const ref = getFirestore().collection(MESSAGE_TEMPLATES_COLLECTION).doc();
  return upsertMessageTemplate({
    id: ref.id,
    title,
    body: opts.body,
    actorEmail: opts.actorEmail,
  });
}

/** Hard-delete a custom template. System AGM invite cannot be removed. */
export async function deleteMessageTemplate(id: string): Promise<void> {
  const templateId = id.trim();
  if (!templateId) {
    throw Object.assign(new Error("template_id_required"), { status: 400 });
  }
  if (templateId === AGM_INVITE_TEMPLATE_ID) {
    throw Object.assign(new Error("cannot_delete_system_template"), {
      status: 400,
    });
  }

  const ref = getFirestore()
    .collection(MESSAGE_TEMPLATES_COLLECTION)
    .doc(templateId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw Object.assign(new Error("not_found"), { status: 404 });
  }
  await ref.delete();
}
