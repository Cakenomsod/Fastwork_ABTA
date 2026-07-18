/**
 * Verify LINE Login ID token → userId (openid).
 * https://developers.line.biz/en/reference/line-login/#verify-id-token
 */

export interface VerifiedLineUser {
  userId: string;
  name?: string;
  picture?: string;
  email?: string;
}

export async function verifyLineIdToken(
  idToken: string,
  clientId: string,
): Promise<VerifiedLineUser> {
  const body = new URLSearchParams({
    id_token: idToken,
    client_id: clientId,
  });

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const desc = String(data.error_description ?? data.error ?? "verify_failed");
    const err = new Error(desc);
    (err as Error & { code?: string }).code = "invalid_id_token";
    throw err;
  }

  const userId = String(data.sub ?? "");
  if (!userId) {
    const err = new Error("missing_sub");
    (err as Error & { code?: string }).code = "invalid_id_token";
    throw err;
  }

  return {
    userId,
    name: typeof data.name === "string" ? data.name : undefined,
    picture: typeof data.picture === "string" ? data.picture : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
  };
}
