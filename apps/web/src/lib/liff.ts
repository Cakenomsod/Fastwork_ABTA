/**
 * LIFF bootstrap for pages that need LINE Login identity.
 */

import liff from "@line/liff";

export type LiffPhase =
  | { phase: "loading" }
  | { phase: "ready"; displayName?: string }
  | { phase: "error"; message: string }
  | { phase: "dev"; displayName?: string };

const LIFF_ID = import.meta.env.VITE_LIFF_ID ?? "";

/** Local browser without LIFF — allow form UI for layout testing only. */
function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

export async function initLiff(): Promise<LiffPhase> {
  if (!LIFF_ID) {
    if (isLocalHost()) {
      return {
        phase: "dev",
        displayName: "โหมดพัฒนา (ยังไม่มี LIFF)",
      };
    }
    return {
      phase: "error",
      message: "ยังไม่ได้ตั้งค่า VITE_LIFF_ID — กรุณาเปิดจาก LINE OA",
    };
  }

  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
      return { phase: "loading" };
    }
    let displayName: string | undefined;
    try {
      const profile = await liff.getProfile();
      displayName = profile.displayName;
    } catch {
      /* profile optional */
    }
    return { phase: "ready", displayName };
  } catch (err) {
    console.error("liff.init failed", err);
    if (isLocalHost()) {
      return {
        phase: "dev",
        displayName: "โหมดพัฒนา (LIFF ไม่พร้อม)",
      };
    }
    return {
      phase: "error",
      message: "ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาเปิดหน้านี้จาก LINE OA อีกครั้ง",
    };
  }
}

export async function getIdToken(): Promise<string | undefined> {
  if (!LIFF_ID) return undefined;
  try {
    if (!liff.isLoggedIn()) return undefined;
    return liff.getIDToken() ?? undefined;
  } catch {
    return undefined;
  }
}

export function getLiffId(): string {
  return LIFF_ID;
}
