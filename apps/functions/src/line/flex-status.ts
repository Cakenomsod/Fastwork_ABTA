/**
 * ABTA member status — LINE Flex Message.
 * Deep-green association branding with gold accents, clear ID hierarchy,
 * status badge, and action buttons. Aligned with 05-Status-and-SLA.md.
 */

import { BRAND, WEB_ORIGIN } from "../config";
import type { StatusView } from "../members/status-view";
import type { StatusTone } from "../members/types";
import type { LineMessage } from "./client";

interface ToneStyle {
  bg: string;
  text: string;
}

const TONE_STYLE: Record<StatusTone, ToneStyle> = {
  active: { bg: "#0F4C36", text: "#FFFFFF" },
  temporary: { bg: "#B9822A", text: "#FFFFFF" },
  warning: { bg: "#D97A19", text: "#FFFFFF" },
  danger: { bg: "#C0392B", text: "#FFFFFF" },
  neutral: { bg: "#5B7083", text: "#FFFFFF" },
};

function detailRow(
  label: string,
  value: string,
  opts: { valueColor?: string; valueWeight?: "regular" | "bold" } = {},
): LineMessage {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    contents: [
      {
        type: "text",
        text: label,
        size: "sm",
        color: BRAND.subtle,
        flex: 4,
        gravity: "top",
      },
      {
        type: "text",
        text: value,
        size: "sm",
        color: opts.valueColor ?? BRAND.ink,
        weight: opts.valueWeight ?? "regular",
        align: "end",
        wrap: true,
        flex: 6,
      },
    ],
  };
}

function separator(): LineMessage {
  return { type: "separator", color: BRAND.line };
}

function actionButton(
  label: string,
  uri: string,
  style: "primary" | "secondary" | "link",
  color?: string,
): LineMessage {
  return {
    type: "button",
    style,
    height: "sm",
    color,
    action: { type: "uri", label, uri },
  };
}

function statusPageUri(view: StatusView, token?: string): string {
  const params = new URLSearchParams({ m: view.memberId });
  if (token) params.set("t", token);
  return `${WEB_ORIGIN}/status?${params.toString()}`;
}

/** Rich, single-bubble status card. */
export function buildStatusFlex(view: StatusView, publicToken?: string): LineMessage {
  const tone = TONE_STYLE[view.statusTone];

  const expiryValue = view.expiryLabel
    ? view.expiryDaysLeft !== undefined && view.expiryDaysLeft >= 0
      ? `${view.expiryLabel}  (อีก ${view.expiryDaysLeft} วัน)`
      : view.expiryDaysLeft !== undefined && view.expiryDaysLeft < 0
        ? `${view.expiryLabel}  (หมดอายุแล้ว)`
        : view.expiryLabel
    : "—";

  const bodyContents: LineMessage[] = [
    // Status badge pill
    {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "box",
          layout: "vertical",
          backgroundColor: tone.bg,
          cornerRadius: "20px",
          paddingAll: "8px",
          paddingStart: "16px",
          paddingEnd: "16px",
          flex: 0,
          contents: [
            {
              type: "text",
              text: view.statusLabel,
              size: "sm",
              weight: "bold",
              color: tone.text,
            },
          ],
        },
      ],
    },
    { type: "box", layout: "vertical", margin: "lg", spacing: "md", contents: [
      detailRow("วันหมดอายุ", expiryValue, { valueWeight: "bold" }),
      separator(),
      detailRow("การชำระเงิน", view.paymentLabel),
      separator(),
      detailRow(
        "ใบเสร็จ",
        view.receiptNumber
          ? `${view.receiptLabel}\n${view.receiptNumber}`
          : view.receiptLabel,
      ),
      separator(),
      detailRow("สัมมนา", view.seminarLabel),
    ] },
  ];

  const footerContents: LineMessage[] = [];
  if (view.memberCardUrl) {
    footerContents.push(
      actionButton("เปิดบัตรสมาชิก", view.memberCardUrl, "primary", BRAND.green),
    );
  }
  if (view.receiptUrl) {
    footerContents.push(
      actionButton("เปิดใบเสร็จ", view.receiptUrl, "secondary"),
    );
  }
  footerContents.push(
    actionButton("ดูสถานะแบบเต็ม", statusPageUri(view, publicToken), "link", BRAND.green),
  );

  if (view.updatedAtLabel) {
    footerContents.push({
      type: "text",
      text: `อัปเดตล่าสุด ${view.updatedAtLabel}`,
      size: "xxs",
      color: BRAND.subtle,
      align: "center",
      margin: "sm",
    });
  }

  return {
    type: "flex",
    altText: `สถานะสมาชิก ABTA • ${view.memberId} • ${view.statusLabel}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingBottom: "18px",
        spacing: "none",
        background: {
          type: "linearGradient",
          angle: "160deg",
          startColor: BRAND.greenDeep,
          endColor: BRAND.greenLight,
        },
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ABTA",
                size: "md",
                weight: "bold",
                color: BRAND.gold,
                flex: 0,
              },
              {
                type: "text",
                text: "บัตรสมาชิก",
                size: "xs",
                color: "#CDE5D8",
                align: "end",
                gravity: "center",
              },
            ],
          },
          {
            type: "text",
            text: BRAND.nameTh,
            size: "xxs",
            color: "#9FC4B2",
            wrap: true,
            margin: "xs",
          },
          {
            type: "text",
            text: view.fullName || "สมาชิก ABTA",
            size: "lg",
            weight: "bold",
            color: "#FFFFFF",
            margin: "lg",
            wrap: true,
          },
          ...(view.legalEntityName
            ? [
                {
                  type: "text",
                  text: view.legalEntityName,
                  size: "xs",
                  color: "#BCD8C9",
                  wrap: true,
                  margin: "xs",
                } as LineMessage,
              ]
            : []),
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "หมายเลขสมาชิก",
                size: "xxs",
                color: "#9FC4B2",
              },
              {
                type: "text",
                text: view.memberId,
                size: "xxl",
                weight: "bold",
                color: BRAND.goldSoft,
              },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: bodyContents,
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "16px",
        paddingTop: "0px",
        contents: footerContents,
      },
      styles: {
        footer: { separator: false },
      },
    },
  };
}
