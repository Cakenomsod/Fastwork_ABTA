/**
 * Plain-text + small Flex helpers for non-status replies.
 * Professional Thai copy for a trade association (สมาคมการค้า).
 */

import { BRAND, LIFF_URL, WEB_ORIGIN, isConfiguredLiffUrl } from "../config";
import type { LineMessage } from "./client";

export function textMessage(text: string): LineMessage {
  return { type: "text", text };
}

function registerUri(): string {
  return isConfiguredLiffUrl() ? LIFF_URL : `${WEB_ORIGIN}/register`;
}

export function helpMessage(): LineMessage {
  return textMessage(
    [
      "สวัสดีครับ 🌿 นี่คือบริการสมาชิก ABTA",
      "",
      "พิมพ์คำสั่งเพื่อใช้งาน:",
      "• เช็คสถานะ — ดูสถานะสมาชิก บัตรสมาชิก และใบเสร็จ",
      "• สมัครสมาชิก — เปิดฟอร์มสมัคร / ลงทะเบียน",
      "• ช่วยเหลือ — แสดงเมนูคำสั่งนี้",
      "",
      "หากยังไม่ได้ผูกบัญชี LINE กับสมาชิก พิมพ์ “สมัครสมาชิก” เพื่อเริ่มต้นครับ",
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
              ? "กดปุ่มด้านล่างเพื่อเปิดฟอร์มสมัครสมาชิกใหม่ใน LINE ครับ"
              : "ฟอร์มสมัครยังตั้งค่า LIFF ไม่ครบ — เปิดหน้าเว็บชั่วคราวได้จากปุ่มด้านล่างครับ",
            size: "sm",
            color: BRAND.ink,
            wrap: true,
          },
          {
            type: "text",
            text: "ถ้าเคยเป็นสมาชิกแล้วและต้องการผูก LINE แจ้งเจ้าหน้าที่ได้ครับ (ฟีเจอร์ยืนยันสมาชิกเก่ากำลังเตรียม)",
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
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            color: BRAND.green,
            action: {
              type: "uri",
              label: hasLiff ? "เปิดฟอร์มสมัคร" : "เปิดหน้าสมัคร",
              uri: registerUri(),
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
      "พิมพ์ “เช็คสถานะ” เพื่อดูสถานะสมาชิกของคุณ หรือพิมพ์ “ช่วยเหลือ” เพื่อดูคำสั่งทั้งหมดครับ",
    ].join("\n"),
  );
}

/** Shown when the LINE user is not yet bound to a member record. */
export function notLinkedFlex(lineUserId?: string): LineMessage {
  const hasLiff = isConfiguredLiffUrl();
  const bodyContents: Record<string, unknown>[] = [
    {
      type: "text",
      text: "บัญชี LINE นี้ยังไม่ได้เชื่อมกับข้อมูลสมาชิกในระบบ ABTA",
      size: "sm",
      color: BRAND.ink,
      wrap: true,
    },
    {
      type: "text",
      text: hasLiff
        ? "กดปุ่มด้านล่างเพื่อสมัครสมาชิกใหม่ หรือยืนยันสมาชิกเก่า (ถ้าเคยเป็นสมาชิกแล้ว)"
        : "ฟอร์มลงทะเบียนกำลังเตรียมเปิดใช้งาน — หากต้องการทดสอบ แจ้งรหัส LINE ด้านล่างให้เจ้าหน้าที่ได้ครับ",
      size: "sm",
      color: BRAND.subtle,
      wrap: true,
    },
  ];

  if (lineUserId) {
    bodyContents.push(
      {
        type: "text",
        text: "รหัส LINE ของคุณ",
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
            text: `สถานะ: สมาชิกชั่วคราว · รอตรวจสอบข้อมูล · ค่าธรรมเนียม ${opts.feeThb} บาท`,
            size: "sm",
            color: BRAND.subtle,
            wrap: true,
            margin: "md",
          },
          {
            type: "text",
            text: "ใช้สิทธิ์สมาชิกได้ทันที · ใบเสร็จชั่วคราวจะออกหลังนายทะเบียนอนุมัติข้อมูล",
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
      "📋 ใบสมัครสมาชิกใหม่",
      `เลขชั่วคราว: ${opts.memberId}`,
      `ชื่อ: ${opts.fullName}`,
      `โทร: ${opts.phone}`,
      "สถานะ: รอตรวจสอบข้อมูล (นายทะเบียน)",
    ].join("\n"),
  );
}

export function errorMessage(): LineMessage {
  return textMessage(
    "ขออภัยครับ ระบบเกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง หากยังพบปัญหาโปรดติดต่อเจ้าหน้าที่สมาคมครับ",
  );
}
