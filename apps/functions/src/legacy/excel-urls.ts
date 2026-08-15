/**
 * Extract http(s) / Google Drive links from Excel cell text and hyperlinks.
 */

const URL_RE = /https?:\/\/[^\s,;|"'<>]+/gi;

export function googleDriveFileId(url: string): string | undefined {
  const openId = /[?&]id=([a-zA-Z0-9_-]+)/.exec(url);
  if (openId?.[1]) return openId[1];
  const filePath = /\/file\/d\/([a-zA-Z0-9_-]+)/.exec(url);
  if (filePath?.[1]) return filePath[1];
  const ucId = /\/uc\?.*?id=([a-zA-Z0-9_-]+)/.exec(url);
  return ucId?.[1];
}

export function googleDriveViewUrl(url: string): string {
  const id = googleDriveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/view` : url;
}

export function googleDriveThumbnailUrl(url: string): string | undefined {
  const id = googleDriveFileId(url);
  return id
    ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w800`
    : undefined;
}

function stripJunkTail(raw: string): string {
  let s = raw.trim();
  s = s.replace(/[.,;]+$/g, "");
  // Trailing lone "?" after an id (common in this workbook's hyperlinks).
  s = s.replace(/([?&]id=[a-zA-Z0-9_-]+)\?+$/i, "$1");
  // Non-ASCII junk appended after a Drive URL (encoding glitches).
  const drive = /^(https?:\/\/(?:drive|docs)\.google\.com\/[^\s]*)/i.exec(s);
  if (drive) {
    let url = drive[1];
    url = url.replace(/[^a-zA-Z0-9._~:/?#\[\]@!$&'()*+,;=-]+$/g, "");
    url = url.replace(/([?&]id=[a-zA-Z0-9_-]+)\?+$/i, "$1");
    return url;
  }
  return s;
}

export function extractHttpUrls(raw: unknown): string[] {
  if (raw == null || raw === "") return [];
  const text = String(raw);
  const found = text.match(URL_RE) ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const piece of found) {
    const url = stripJunkTail(piece);
    if (!/^https?:\/\//i.test(url)) continue;
    const key = googleDriveFileId(url) ?? url;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}
