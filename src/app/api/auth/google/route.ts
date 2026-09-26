import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/baseUrl";
import { OAUTH_COOKIE, isGoogleLoginEnabled, startGoogleLogin } from "@/lib/googleAuth";

/** "Google ile giriş" düğmesi buraya gelir; Google'ın hesap seçme ekranına yönlendirir. */
export async function GET() {
  const baseUrl = await getBaseUrl();
  if (!isGoogleLoginEnabled()) {
    return NextResponse.redirect(`${baseUrl}/admin/login?hata=google-kapali`, { status: 303 });
  }

  const { url, cookie } = await startGoogleLogin(`${baseUrl}/api/auth/google/callback`);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set(OAUTH_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // lax: Google'dan dönüş üst düzey GET yönlendirmesi, çerez gönderilir.
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
