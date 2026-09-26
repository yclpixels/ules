import "server-only";
import { createHash, randomBytes } from "crypto";
import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Personel için "Google ile giriş" (OAuth 2.0 + OpenID Connect, yetki kodu
 * akışı + PKCE). Harici kütüphane yok; oturumda da kullanılan `jose` ile.
 *
 * Güvenlik:
 * - state: başka bir sitenin başlattığı giriş akışı reddedilir (CSRF).
 * - PKCE: yetki kodu ele geçirilse bile doğrulayıcı olmadan kullanılamaz.
 * - ID token Google'ın açık anahtarlarıyla doğrulanır (imza, issuer,
 *   audience, süre) ve e-postanın Google tarafından doğrulanmış olması şart.
 * - Google ile HESAP AÇILMAZ: yalnızca e-postası personel kaydına bağlanmış,
 *   aktif hesaplar giriş yapabilir (bkz. callback).
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
export const OAUTH_COOKIE = "masa_google_oauth";

export function isGoogleLoginEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function base64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function cookieKey() {
  return new TextEncoder().encode(`google-oauth:${process.env.SESSION_SECRET}`);
}

/** Akışı başlatır: Google'a yönlendirme adresi + tarayıcıda saklanacak imzalı çerez. */
export async function startGoogleLogin(redirectUri: string) {
  const state = base64url(randomBytes(24));
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());

  const cookie = await new SignJWT({ state, verifier })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(cookieKey());

  const url = new URL(GOOGLE_AUTH_URL);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    // Tabletteki ortak tarayıcıda yanlış Google hesabıyla girilmesin.
    prompt: "select_account",
  }).toString();

  return { url: url.toString(), cookie };
}

export type GoogleLoginResult =
  | { ok: true; email: string }
  | { ok: false; reason: "state" | "exchange" | "token" | "unverified" };

/** Google'dan dönüşte: state'i doğrular, kodu belirteçle takas eder, e-postayı döner. */
export async function finishGoogleLogin(params: {
  code: string | null;
  state: string | null;
  cookie: string | undefined;
  redirectUri: string;
}): Promise<GoogleLoginResult> {
  if (!params.code || !params.state || !params.cookie) return { ok: false, reason: "state" };

  let saved: { state: string; verifier: string };
  try {
    const { payload } = await jwtVerify(params.cookie, cookieKey(), { algorithms: ["HS256"] });
    saved = payload as unknown as { state: string; verifier: string };
  } catch {
    return { ok: false, reason: "state" };
  }
  if (saved.state !== params.state) return { ok: false, reason: "state" };

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: params.code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: params.redirectUri,
      grant_type: "authorization_code",
      code_verifier: saved.verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res?.ok) return { ok: false, reason: "exchange" };
  const tokens = (await res.json().catch(() => ({}))) as { id_token?: string };
  if (!tokens.id_token) return { ok: false, reason: "exchange" };

  try {
    const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    if (!email || payload.email_verified !== true) return { ok: false, reason: "unverified" };
    return { ok: true, email };
  } catch {
    return { ok: false, reason: "token" };
  }
}
