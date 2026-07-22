const LIFF_URL = import.meta.env.VITE_LIFF_URL ?? "";

/** Open a LIFF-auth page via liff.line.me (required when Endpoint URL is /register). */
export function liffPageUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!LIFF_URL) return normalized;
  const base = LIFF_URL.replace(/\/+$/, "");
  return normalized === "/" ? base : `${base}${normalized}`;
}

/** Same-origin status path for in-LIFF navigation (keeps query params). */
export function memberStatusHref(memberId: string, token?: string): string {  const q = new URLSearchParams({ m: memberId });
  if (token) q.set("t", token);
  return `/status?${q.toString()}`;
}

/** Normalize API absolute status URL to a relative LIFF-safe path. */
export function memberStatusHrefFromUrl(statusUrl: string): string {
  try {
    const url = new URL(statusUrl, window.location.origin);
    const memberId = url.searchParams.get("m") ?? url.searchParams.get("memberId") ?? "";
    if (!memberId) return "/status";
    const token = url.searchParams.get("t") ?? url.searchParams.get("token") ?? undefined;
    return memberStatusHref(memberId, token || undefined);
  } catch {
    return statusUrl.startsWith("/") ? statusUrl : "/status";
  }
}

/** Read member status query params, including nested liff.state when present. */
export function readMemberStatusParams(search = window.location.search): {
  memberId: string;
  token: string;
} {
  const params = new URLSearchParams(search);
  let memberId = params.get("m") ?? params.get("memberId") ?? "";
  let token = params.get("t") ?? params.get("token") ?? "";

  const liffState = params.get("liff.state");
  if (liffState) {
    const decoded = decodeURIComponent(liffState);
    const queryStart = decoded.indexOf("?");
    if (queryStart >= 0) {
      const nested = new URLSearchParams(decoded.slice(queryStart + 1));
      memberId ||= nested.get("m") ?? nested.get("memberId") ?? "";
      token ||= nested.get("t") ?? nested.get("token") ?? "";
    }
  }

  return { memberId, token };
}

/** Resolve SPA route path, honoring LIFF liff.state deep links. */
export function effectiveAppPath(pathname = window.location.pathname): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  const liffState = new URLSearchParams(window.location.search).get("liff.state");
  if (!liffState) return path;

  const decoded = decodeURIComponent(liffState);
  const statePath = (decoded.split("?")[0] ?? "").replace(/\/+$/, "") || "/";
  return statePath.startsWith("/") ? statePath : path;
}
