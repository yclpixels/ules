import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBaseUrl } from "@/lib/baseUrl";
import { OAUTH_COOKIE, finishGoogleLogin, isGoogleLoginEnabled } from "@/lib/googleAuth";
import { prisma } from "@/lib/prisma";
import { createStaffSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rateLimit";

/**
 * Google'dan dönüş. Doğrulanmış e-posta, AKTİF bir personel hesabına
 * bağlıysa oturum açılır; değilse giriş sayfasına hata koduyla dönülür.
 * Google ile hesap oluşturulmaz — e-postayı müdür Personel sayfasından ya da
 * personel kendisi Hesabım'dan bağlar.
 */
export async function GET(req: Request) {
  const baseUrl = await getBaseUrl();
  const fail = (code: string) =>
    NextResponse.redirect(`${baseUrl}/admin/login?hata=${code}`, { status: 303 });

  if (!isGoogleLoginEnabled()) return fail("google-kapali");

  const ip = clientIp(req);
  if (!rateLimit(`login:google:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 }).ok) {
    return fail("cok-deneme");
  }

  const cookieStore = await cookies();
  const url = new URL(req.url);
  const result = await finishGoogleLogin({
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    cookie: cookieStore.get(OAUTH_COOKIE)?.value,
    redirectUri: `${baseUrl}/api/auth/google/callback`,
  });
  // Tek kullanımlık: her durumda silinir.
  cookieStore.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });

  if (!result.ok) {
    // Kullanıcı Google ekranında "iptal" dediyse de buraya düşer.
    return fail(url.searchParams.get("error") === "access_denied" ? "google-iptal" : "google-hata");
  }

  const staff = await prisma.staffUser.findUnique({
    where: { email: result.email },
    include: { branch: { select: { name: true } } },
  });
  if (!staff || !staff.isActive) {
    if (staff) {
      await audit({
        branchId: staff.branchId,
        action: "LOGIN_FAILED",
        actorName: staff.username,
        detail: "Google ile giriş: pasif hesap",
        ip,
      });
    }
    return fail("google-hesap-yok");
  }

  await audit({
    branchId: staff.branchId,
    action: "LOGIN_SUCCESS",
    actorName: staff.name,
    actorId: staff.id,
    detail: "Google ile giriş",
    ip,
  });
  await createStaffSession({
    staffId: staff.id,
    name: staff.name,
    role: staff.role,
    branchId: staff.branchId,
    branchName: staff.branch.name,
    sv: staff.sessionVersion,
  });
  return NextResponse.redirect(`${baseUrl}/admin`, { status: 303 });
}
