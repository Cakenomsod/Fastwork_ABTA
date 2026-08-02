/**
 * Plain-text + small Flex helpers for non-status replies.
 * Warm, respectful Thai copy for a trade association (สมาคมการค้า).
 */

import { BRAND, LIFF_URL, WEB_ORIGIN, isConfiguredLiffUrl, liffPageUri } from "../config";
import type { LineMessage } from "./client";

export function textMessage(text: string): LineMessage {
  return { type: "text", text };
}

function registerUri(query?: string): string {
  const base = isConfiguredLiffUrl() ? LIFF_URL : `${WEB_ORIGIN}/register`;
  if (!query) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${query}`;
}

export function renewInviteText(): LineMessage {
  return textMessage(
    [
      "ต่ออายุสมาชิก ABTA",
      "",
      "กรุณากดลิงก์ด้านล่างเพื่อแนบสลิปและส่งคำขอต่ออายุได้เลยครับ",
      liffPageUri("/renew"),
    ].join("\n"),
  );
}

export function seminarInviteText(): LineMessage {
  return textMessage(
    [
      "สมัครสัมมนา ABTA",
      "",
      "ท่านสามารถเลือกรายการและกรอกแบบฟอร์มได้ที่ลิงก์ด้านล่างครับ",
      liffPageUri("/seminar"),
    ].join("\n"),
  );
}

export function helpMessage(): LineMessage {
  return textMessage(
    [
      `สวัสดีครับ ยินดีต้อนรับสู่บริการสมาชิก ${BRAND.short}`,
      "",
      "พิมพ์คำสั่งด้านล่างเพื่อใช้งานได้เลยครับ:",
      "• เช็คสถานะ — ดูสถานะสมาชิก บัตรสมาชิก และใบเสร็จ",
      "• สมัครสมาชิก — เปิดแบบฟอร์มสมัคร / ลงทะเบียน",
      "• ต่ออายุ — ต่ออายุสมาชิกพร้อมแนบสลิป",
      "• สัมมนา — สมัครงานสัมมนา",
      "• ช่วยเหลือ — แสดงเมนูคำสั่งนี้",
      "",
      "หากยังไม่ได้เชื่อมบัญชี LINE กับข้อมูลสมาชิก",
      "พิมพ์ “สมัครสมาชิก” เพื่อเริ่มต้นได้ครับ",
    ].join("\n"),
  );
}

/** Reply when the user asks to register — includes LIFF / web button. */
export function registerInviteFlex(): LineMessage {
  const hasLiff = isConfiguredLiffUrl();
  return {
    type: "flex",
    altText: "สมัครสมาชิก ABTA",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "160deg",
          startColor: BRAND.greenDeep,
          endColor: BRAND.greenLight,
        },
        contents: [
          {
            type: "text",
            text: "ABTA",
            size: "md",
            weight: "bold",
            color: BRAND.gold,
          },
          {
            type: "text",
            text: "สมัครสมาชิก",
            size: "lg",
            weight: "bold",
            color: "#FFFFFF",
            margin: "md",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: hasLiff
              ? "กรุณากดปุ่มด้านล่างเพื่อเปิดแบบฟอร์มสมัครสมาชิกใหม่ใน LINE ได้เลยครับ"
              : "แบบฟอร์มสมัครยังตั้งค่า LIFF ไม่ครบ — ท่านเปิดหน้าเว็บชั่วคราวได้จากปุ่มด้านล่างครับ",
            size: "sm",
            color: BRAND.ink,
            wrap: true,
          },
          {
            type: "text",
            text: "หากท่านเคยเป็นสมาชิกแล้ว กรุณากดปุ่ม «ยืนยันสมาชิกเก่า» เพื่อเชื่อม LINE กับข้อมูลเดิมได้ครับ",
            size: "xs",
            color: BRAND.subtle,
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        paddingTop: "0px",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            color: BRAND.green,
            action: {
              type: "uri",
              label: hasLiff ? "เปิดแบบฟอร์มสมัคร" : "เปิดหน้าสมัคร",
              uri: registerUri(),
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "ยืนยันสมาชิกเก่า",
              uri: registerUri("flow=legacy"),
            },
          },
        ],
      },
    },
  };
}

export function greetingMessage(): LineMessage {
  return textMessage(
    [
      `สวัสดีครับ ยินดีต้อนรับสู่ ${BRAND.oaName}`,
      "พิมพ์ “เช็คสถานะ” เพื่อดูสถานะสมาชิกของท่าน หรือพิมพ์ “ช่วยเหลือ” เพื่อดูคำสั่งทั้งหมดได้ครับ",
    ].join("\n"),
  );
}

/** Shown when the LINE user is not yet bound to a member record. */
export function notLinkedFlex(lineUserId?: string): LineMessage {
  const hasLiff = isConfiguredLiffUrl();
  const bodyContents: Record<string, unknown>[] = [
    {
      type: "text",
      text: "บัญชี LINE นี้ยังไม่ได้เชื่อมกับข้อมูลสมาชิกในระบบ ABTA ครับ",
      size: "sm",
      color: BRAND.ink,
      wrap: true,
    },
    {
      type: "text",
      text: hasLiff
        ? "กรุณากดปุ่มด้านล่างเพื่อสมัครสมาชิกใหม่ หรือยืนยันสมาชิกเก่าหากท่านเคยเป็นสมาชิกแล้วครับ"
        : "แบบฟอร์มลงทะเบียนกำลังเตรียมเปิดใช้งาน — หากต้องการทดสอบ กรุณาแจ้งรหัส LINE ด้านล่างให้เจ้าหน้าที่ได้ครับ",
      size: "sm",
      color: BRAND.subtle,
      wrap: true,
    },
  ];

  if (lineUserId) {
    bodyContents.push(
      {
        type: "text",
        text: "รหัส LINE ของท่าน",
        size: "xs",
        color: BRAND.subtle,
        margin: "lg",
      },
      {
        type: "text",
        text: lineUserId,
        size: "sm",
        weight: "bold",
        color: BRAND.green,
        wrap: true,
      },
    );
  }

  return {
    type: "flex",
    altText: "ยังไม่ได้ผูกบัญชีสมาชิก ABTA",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "160deg",
          startColor: BRAND.greenDeep,
          endColor: BRAND.greenLight,
        },
        contents: [
          {
            type: "text",
            text: "ABTA",
            size: "md",
            weight: "bold",
            color: BRAND.gold,
          },
          {
            type: "text",
            text: "ยังไม่พบบัญชีสมาชิก",
            size: "lg",
            weight: "bold",
            color: "#FFFFFF",
            margin: "md",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: bodyContents,
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        paddingTop: "0px",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            color: BRAND.green,
            action: {
              type: "uri",
              label: hasLiff ? "สมัครสมาชิกใหม่" : "เปิดหน้าเว็บสมาชิก",
              uri: hasLiff ? registerUri() : WEB_ORIGIN,
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "ยืนยันสมาชิกเก่า",
              uri: registerUri("flow=legacy"),
            },
          },
        ],
      },
    },
  };
}

export function registrationConfirmFlex(opts: {
  memberId: string;
  fullName: string;
  statusUrl: string;
  feeThb: number;
}): LineMessage {
  return {
    type: "flex",
    altText: `รับสมัครแล้ว — ${opts.memberId}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "160deg",
          startColor: BRAND.greenDeep,
          endColor: BRAND.greenLight,
        },
        contents: [
          {
            type: "text",
            text: "ABTA",
            size: "md",
            weight: "bold",
            color: BRAND.gold,
          },
          {
            type: "text",
            text: "รับใบสมัครแล้ว",
            size: "lg",
            weight: "bold",
            color: "#FFFFFF",
            margin: "md",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: opts.fullName,
            size: "md",
            weight: "bold",
            color: BRAND.ink,
            wrap: true,
          },
          {
            type: "text",
            text: "หมายเลขสมาชิกชั่วคราว",
            size: "xs",
            color: BRAND.subtle,
            margin: "lg",
          },
          {
            type: "text",
            text: opts.memberId,
            size: "lg",
            weight: "bold",
            color: BRAND.green,
            wrap: true,
          },
          {
            type: "text",
            text: `สถานะ: สมาชิกชั่วคราว · รอตรวจสอบข้อมูล · ค่าธรรมเนียม ${opts.feeThb.toLocaleString("th-TH")} บาท`,
            size: "sm",
            color: BRAND.subtle,
            wrap: true,
            margin: "md",
          },
          {
            type: "text",
            text: "ท่านใช้สิทธิ์สมาชิกได้ทันทีครับ · ใบเสร็จชั่วคราวจะออกหลังนายทะเบียนอนุมัติข้อมูล",
            size: "sm",
            color: BRAND.ink,
            wrap: true,
            margin: "md",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        paddingTop: "0px",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            color: BRAND.green,
            action: {
              type: "uri",
              label: "ดูสถานะสมาชิก",
              uri: opts.statusUrl,
            },
          },
        ],
      },
    },
  };
}

export function staffNewRegistrationText(opts: {
  memberId: string;
  fullName: string;
  phone: string;
}): LineMessage {
  return textMessage(
    [
      "ใบสมัครสมาชิกใหม่",
      `เลขชั่วคราว: ${opts.memberId}`,
      `ชื่อ: ${opts.fullName}`,
      `โทร: ${opts.phone}`,
      "สถานะ: รอตรวจสอบข้อมูล (นายทะเบียน)",
    ].join("\n"),
  );
}

export function dataReviewApprovedText(opts: {
  fullName: string;
  permanentMemberId: string;
  receiptNumber: string;
  statusUrl: string;
}): LineMessage {
  return textMessage(
    [
      "นายทะเบียนอนุมัติข้อมูลของท่านแล้วครับ",
      `คุณ${opts.fullName}`,
      "",
      `เลขสมาชิกถาวร: ${opts.permanentMemberId}`,
      `ใบเสร็จชั่วคราว: ${opts.receiptNumber}`,
      "สถานะ: สมาชิกสมบูรณ์ · รอเหรัญญิกตรวจสลิป",
      "",
      `ดูสถานะ: ${opts.statusUrl}`,
    ].join("\n"),
  );
}

export function dataReviewRejectedText(opts: {
  fullName: string;
  memberId: string;
  reason: string;
  editUrl: string;
  statusUrl: string;
}): LineMessage {
  return textMessage(
    [
      "ข้อมูลสมาชิกยังไม่ผ่านการตรวจสอบครับ",
      `คุณ${opts.fullName}`,
      `เลขสมาชิก: ${opts.memberId}`,
      "",
      `เหตุผล: ${opts.reason}`,
      "",
      "กรุณาแก้ไขข้อมูลแล้วส่งใหม่อีกครั้งได้เลยครับ",
      `แก้ไขและส่งใหม่: ${opts.editUrl}`,
      `ดูสถานะ: ${opts.statusUrl}`,
    ].join("\n"),
  );
}

export function slipReviewApprovedText(opts: {
  fullName: string;
  memberId: string;
  receiptNumber: string;
  statusUrl: string;
}): LineMessage {
  return textMessage(
    [
      "เหรัญญิกยืนยันการชำระเงินของท่านแล้วครับ",
      `คุณ${opts.fullName}`,
      `เลขสมาชิก: ${opts.memberId}`,
      `ใบเสร็จตัวจริง: ${opts.receiptNumber}`,
      "",
      `ดูสถานะ / ใบเสร็จ: ${opts.statusUrl}`,
    ].join("\n"),
  );
}

export function slipReviewRejectedText(opts: {
  fullName: string;
  memberId: string;
  reason: string;
  nextReceiptNumber: string;
  statusUrl: string;
  slipUploadUrl?: string;
}): LineMessage {
  return textMessage(
    [
      "สลิปยังไม่ผ่านการตรวจสอบครับ",
      `คุณ${opts.fullName}`,
      `เลขสมาชิก: ${opts.memberId} (ยังเป็นสมาชิกสมบูรณ์)`,
      "",
      `เหตุผล: ${opts.reason}`,
      `เลขใบเสร็จใหม่ (รอส่งสลิป): ${opts.nextReceiptNumber}`,
      "",
      opts.slipUploadUrl
        ? `กรุณาส่งสลิปใหม่ได้ที่: ${opts.slipUploadUrl}`
        : "กรุณาส่งสลิปใหม่ผ่าน LINE OA ได้เลยครับ",
      `ดูสถานะ: ${opts.statusUrl}`,
    ].join("\n"),
  );
}

export function expiryReminderText(opts: {
  firstName: string;
  daysLeft: 45 | 15;
  expiryLabel: string;
  renewUrl: string;
}): LineMessage {
  return textMessage(
    [
      `แจ้งเตือนต่ออายุสมาชิก (เหลืออีก ${opts.daysLeft} วัน)`,
      `คุณ${opts.firstName}`,
      `วันหมดอายุ: ${opts.expiryLabel}`,
      "",
      "กรุณาต่ออายุสมาชิกเพื่อรักษาสิทธิ์ของท่านครับ",
      `ต่ออายุ: ${opts.renewUrl}`,
    ].join("\n"),
  );
}

/** Mid-March nudge for board members before the April AGM. */
export function boardRenewalReminderText(opts: {
  firstName: string;
  renewUrl: string;
  year: number;
}): LineMessage {
  return textMessage(
    [
      "แจ้งเตือนต่ออายุสมาชิก (กรรมการสมาคม)",
      `คุณ${opts.firstName}`,
      "",
      `เพื่อรักษาสิทธิ์ก่อนประชุมใหญ่สามัญประจำปี ${opts.year + 543}`,
      "กรุณาต่ออายุสมาชิกภายในช่วงกลางเดือนมีนาคมครับ",
      "",
      `ต่ออายุ: ${opts.renewUrl}`,
    ].join("\n"),
  );
}

export function legacyBindSuccessText(opts: {
  fullName: string;
  memberId: string;
  legacyMemberId: string;
  statusUrl: string;
}): LineMessage {
  return textMessage(
    [
      "ยืนยันสมาชิกเก่าสำเร็จแล้วครับ",
      `คุณ${opts.fullName}`,
      `เลขสมาชิกใหม่: ${opts.memberId}`,
      `เลขอ้างอิงเดิม: ${opts.legacyMemberId}`,
      "",
      `เช็คสถานะ: ${opts.statusUrl}`,
    ].join("\n"),
  );
}

export function memberIdsUpdatedText(opts: {
  fullName: string;
  memberIdChange?: { from: string; to: string };
  receiptNumberChange?: { from: string; to: string };
  statusUrl: string;
  cardUrl?: string;
  receiptUrl?: string;
}): LineMessage {
  const lines = [
    "มีการแก้ไขข้อมูลสมาชิกของท่านครับ",
    `คุณ${opts.fullName}`,
    "",
  ];
  if (opts.memberIdChange) {
    lines.push(
      `เลขสมาชิก: ${opts.memberIdChange.from} → ${opts.memberIdChange.to}`,
    );
  }
  if (opts.receiptNumberChange) {
    lines.push(
      `เลขใบเสร็จ: ${opts.receiptNumberChange.from} → ${opts.receiptNumberChange.to}`,
    );
  }
  lines.push("", "ท่านสามารถตรวจสอบข้อมูลได้ที่:");
  lines.push(`ดูสถานะ: ${opts.statusUrl}`);
  if (opts.cardUrl) {
    lines.push(`บัตรสมาชิก: ${opts.cardUrl}`);
  }
  if (opts.receiptUrl) {
    lines.push(`ใบเสร็จ: ${opts.receiptUrl}`);
  }
  return textMessage(lines.join("\n"));
}

export function errorMessage(): LineMessage {
  return textMessage(
    "ขออภัยครับ ระบบเกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง หากยังพบปัญหาโปรดติดต่อเจ้าหน้าที่สมาคมได้เลยครับ",
  );
}
