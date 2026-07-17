/**
 * Plain-text + small Flex helpers for non-status replies.
 * Professional Thai copy for a trade association (สมาคมการค้า).
 */

import { BRAND, LIFF_URL } from "../config";
import type { LineMessage } from "./client";

export function textMessage(text: string): LineMessage {
  return { type: "text", text };
}

export function helpMessage(): LineMessage {
  return textMessage(
    [
      "สวัสดีครับ 🌿 นี่คือบริการสมาชิก ABTA",
      "",
      "พิมพ์คำสั่งเพื่อใช้งาน:",
      "• เช็คสถานะ — ดูสถานะสมาชิก บัตรสมาชิก และใบเสร็จ",
      "• ช่วยเหลือ — แสดงเมนูคำสั่งนี้",
      "",
      "หากยังไม่ได้ผูกบัญชี LINE กับสมาชิก กรุณาลงทะเบียนก่อนใช้งานครับ",
    ].join("\n"),
  );
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
export function notLinkedFlex(): LineMessage {
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
        contents: [
          {
            type: "text",
            text: "บัญชี LINE นี้ยังไม่ได้เชื่อมกับข้อมูลสมาชิกในระบบ ABTA",
            size: "sm",
            color: BRAND.ink,
            wrap: true,
          },
          {
            type: "text",
            text: "กรุณาลงทะเบียนสมาชิกใหม่ หรือยืนยันตัวตนสมาชิกเดิมเพื่อผูกบัญชี LINE ก่อนใช้งานเช็คสถานะครับ",
            size: "sm",
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
              label: "ลงทะเบียน / ยืนยันสมาชิก",
              uri: LIFF_URL,
            },
          },
        ],
      },
    },
  };
}

export function errorMessage(): LineMessage {
  return textMessage(
    "ขออภัยครับ ระบบเกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง หากยังพบปัญหาโปรดติดต่อเจ้าหน้าที่สมาคมครับ",
  );
}
