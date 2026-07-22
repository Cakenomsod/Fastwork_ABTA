/**
 * LIFF bootstrap for pages that need LINE Login identity.
 */

import liff from "@line/liff";
import { effectiveAppPath } from "./member-links";

export type LiffPhase =
  | { phase: "loading" }
  | { phase: "ready"; displayName?: string }
  | { phase: "error"; message: string }
  | { phase: "dev"; displayName?: string };

const LIFF_ID = import.meta.env.VITE_LIFF_ID ?? "";
const LIFF_URL = import.meta.env.VITE_LIFF_URL ?? "";
const LIFF_ENDPOINT_PATH =
  (import.meta.env.VITE_LIFF_ENDPOINT ?? "/register").replace(/\/+$/, "") ||
  "/register";

/** Pages that require LINE Login — must enter via the LIFF URL, not a bare /renew path. */
const LIFF_AUTH_PATHS = new Set(["/renew", "/seminar", "/slip", "/register"]);

/** Local browser without LIFF — allow form UI for layout testing only. */
function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

function isOnLiffEndpoint(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === LIFF_ENDPOINT_PATH;
}

function hasLiffCallbackParams(): boolean {
  const params = new URLSearchParams(window.location.search);
  return (
    params.has("liff.state") ||
    params.has("liff.redirect_uri") ||
    params.has("code") ||
    params.has("state")
  );
}

/**
 * LIFF Endpoint URL is /register — opening /renew or /seminar directly breaks
 * liff.init() and liff.login() (400 from LINE OAuth). Re-enter via liff.line.me.
 */
function ensureLiffEntry(): boolean {
  if (!LIFF_URL || isLocalHost()) return true;
  if (isOnLiffEndpoint() || hasLiffCallbackParams()) return true;

  const appPath = effectiveAppPath();
  if (!LIFF_AUTH_PATHS.has(appPath)) return true;

  const base = LIFF_URL.replace(/\/+$/, "");
  const suffix = appPath === "/" ? "" : appPath;
  window.location.replace(`${base}${suffix}`);
  return false;
}

/** OAuth redirect must target the LIFF Endpoint URL, with liff.state for deep links. */
function loginRedirectUri(): string {
  if (isOnLiffEndpoint() && hasLiffCallbackParams()) {
    return window.location.href.split("#")[0] ?? window.location.href;
  }

  const appPath = effectiveAppPath();
  const uri = new URL(LIFF_ENDPOINT_PATH, window.location.origin);
  if (appPath !== LIFF_ENDPOINT_PATH && appPath !== "/") {
    uri.searchParams.set("liff.state", appPath);
  }
  return uri.toString();
}

export async function initLiff(): Promise<LiffPhase> {
  if (!ensureLiffEntry()) {
    return { phase: "loading" };
  }

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
      liff.login({ redirectUri: loginRedirectUri() });
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
    const token = liff.getIDToken()?.trim();
    return token || undefined;
  } catch {
    return undefined;
  }
}

export function getLiffId(): string {
  return LIFF_ID;
}
