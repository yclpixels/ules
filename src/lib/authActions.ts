"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createStaffSession, deleteAdminSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { verifyAdminSession, verifyManagerSession } from "@/lib/dal";
import { clientIpFromHeaders, rateLimit } from "@/lib/rateLimit";
import { Prisma } from "@/generated/prisma/client";
import { audit } from "@/lib/audit";
import { headers } from "next/headers";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { parseContact } from "@/lib/contact";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return { error: "Kullanıcı adı ve şifre gerekli" };
  }

  // Brute-force koruması: IP başına 15 dk'da 10, kullanıcı adı başına 15 dk'da 5 deneme
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const byIp = rateLimit(`login:ip:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  const byUser = rateLimit(`login:user:${username}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!byIp.ok || !byUser.ok) {
    return { error: "Çok fazla deneme. 15 dakika sonra tekrar deneyin." };
  }

  const staff = await prisma.staffUser.findUnique({
    where: { username },
    include: { branch: true },
  });
  if (!staff || !staff.isActive || !verifyPassword(password, staff.passwordHash)) {
    // Yetkisiz erişim denemesini kaydet. Kullanıcı adı hiç yoksa hangi şubeye
    // yazacağımızı bilemeyiz, o durumda kayıt atlanır (şube bazlı tablo).
    if (staff) {
      await audit({
        branchId: staff.branchId,
        action: "LOGIN_FAILED",
        actorName: username,
        detail: staff.isActive ? "Şifre yanlış" : "Pasif hesapla giriş denendi",
      });
    }
    return { error: "Kullanıcı adı veya şifre yanlış" };
  }

  await audit({
    branchId: staff.branchId,
    action: "LOGIN_SUCCESS",
    actorName: staff.name,
    actorId: staff.id,
  });

  await createStaffSession({
    staffId: staff.id,
    name: staff.name,
    role: staff.role,
    branchId: staff.branchId,
    branchName: staff.branch.name,
    sv: staff.sessionVersion,
  });
  redirect("/admin");
}

export async function logoutAction() {
  await deleteAdminSession();
  redirect("/admin/login");
}

export async function addStaffAction(formData: FormData) {
  const session = await verifyManagerSession();

  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "WAITER") === "MANAGER"
    ? "MANAGER"
    : "WAITER";

  if (!name || !username || password.length < MIN_PASSWORD_LENGTH) {
    return;
  }
  const email = parseGoogleEmail(formData.get("email"));
  if (email === undefined) redirect("/admin/personel?hata=eposta-gecersiz");

  // Kullanıcı adı ve e-posta tüm şubelerde tekil; çakışırsa Prisma P2002
  // fırlatır ve müdür beyaz hata sayfası görürdü — yakalayıp forma dönüyoruz.
  try {
    await prisma.staffUser.create({
      data: {
        name,
        username,
        email,
        passwordHash: hashPassword(password),
        role,
        branchId: session.branchId,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      redirect(
        `/admin/personel?hata=${uniqueTarget(err) === "email" ? "eposta-mevcut" : "kullanici-mevcut"}`
      );
    }
    throw err;
  }

  await audit({
    branchId: session.branchId,
    action: "STAFF_ADDED",
    actorName: session.name,
    actorId: session.staffId,
    detail: `${name} (${username}), rol: ${role === "MANAGER" ? "Müdür" : "Garson"}`,
  });

  revalidatePath("/admin/personel");
}

/**
 * Müdürün değiştirebileceği personel. Platform sahibi (OWNER) hesabı bir
 * şubeye bağlı dursa da o şubenin müdürü tarafından pasifleştirilemez ya da
 * şifresi sıfırlanamaz: sıfırlayan müdür sahip hesabına girip tüm
 * işletmeleri ve talepleri görürdü (yetki yükseltme). Sadece sahip kendisi.
 */
function manageableStaffFilter(session: { role: string; branchId: string }) {
  return session.role === "OWNER"
    ? { branchId: session.branchId }
    : { branchId: session.branchId, role: { not: "OWNER" as const } };
}


/**
 * "Google ile giriş" e-postası: boş → null (bağlantıyı kaldırır), geçerli →
 * küçük harf, geçersiz → undefined.
 */
function parseGoogleEmail(value: FormDataEntryValue | null): string | null | undefined {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return null;
  // Doğrulama lib/contact.ts ile aynı (birim testli).
  const parsed = parseContact(v);
  return parsed?.kind === "email" && v.length <= 200 ? parsed.value : undefined;
}

/** P2002 hangi alanda çakıştı (username / email). */
function uniqueTarget(err: Prisma.PrismaClientKnownRequestError) {
  const target = (err.meta?.target ?? []) as string[] | string;
  return (Array.isArray(target) ? target.join(",") : String(target)).includes("email")
    ? "email"
    : "username";
}

/** Müdür: personelin Google e-postasını bağlar/değiştirir/kaldırır. */
export async function setStaffEmailAction(formData: FormData) {
  const session = await verifyManagerSession();
  const id = String(formData.get("id") || "");
  const email = parseGoogleEmail(formData.get("email"));
  if (!id) return;
  if (email === undefined) redirect("/admin/personel?hata=eposta-gecersiz");

  let updated;
  try {
    updated = await prisma.staffUser.updateMany({
      where: { id, ...manageableStaffFilter(session) },
      data: { email },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      redirect("/admin/personel?hata=eposta-mevcut");
    }
    throw err;
  }
  if (updated.count > 0) {
    const target = await prisma.staffUser.findUnique({ where: { id }, select: { name: true } });
    await audit({
      branchId: session.branchId,
      action: "STAFF_EMAIL_CHANGED",
      actorName: session.name,
      actorId: session.staffId,
      detail: `${target?.name ?? id}: ${email ? "Google e-postası bağlandı" : "Google e-postası kaldırıldı"}`,
    });
  }
  revalidatePath("/admin/personel");
}

export type OwnEmailState = { error?: string; success?: string } | undefined;

/** Herkes: kendi Google e-postasını bağlar (Hesabım). */
export async function setOwnEmailAction(
  _prev: OwnEmailState,
  formData: FormData
): Promise<OwnEmailState> {
  const session = await verifyAdminSession();
  const email = parseGoogleEmail(formData.get("email"));
  if (email === undefined) return { error: "Geçerli bir e-posta adresi girin" };
  try {
    await prisma.staffUser.update({ where: { id: session.staffId }, data: { email } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Bu e-posta başka bir personel hesabına bağlı" };
    }
    throw err;
  }
  await audit({
    branchId: session.branchId,
    action: "STAFF_EMAIL_CHANGED",
    actorName: session.name,
    actorId: session.staffId,
    detail: email ? "Kendi Google e-postasını bağladı" : "Kendi Google e-postasını kaldırdı",
  });
  revalidatePath("/admin/hesabim");
  return {
    success: email
      ? "Kaydedildi. Artık giriş ekranında \"Google ile giriş yap\" ile girebilirsiniz."
      : "Google bağlantısı kaldırıldı.",
  };
}

export async function toggleStaffActiveAction(formData: FormData) {
  const session = await verifyManagerSession();

  const id = String(formData.get("id") || "");
  const isActive = String(formData.get("isActive")) === "true";
  if (!id || id === session.staffId) return; // kendi hesabını pasifleştiremesin

  const updated = await prisma.staffUser.updateMany({
    where: { id, ...manageableStaffFilter(session) },
    // Pasifleşen hesabın oturumu tekrar aktif edilince de geri gelmesin.
    data: { isActive: !isActive, sessionVersion: { increment: 1 } },
  });

  if (updated.count > 0) {
    const target = await prisma.staffUser.findUnique({
      where: { id },
      select: { name: true },
    });
    await audit({
      branchId: session.branchId,
      action: isActive ? "STAFF_DEACTIVATED" : "STAFF_ACTIVATED",
      actorName: session.name,
      actorId: session.staffId,
      detail: target?.name ?? id,
    });
  }

  revalidatePath("/admin/personel");
}

export type ChangePasswordState = { error?: string; success?: boolean } | undefined;

export async function changeOwnPasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await verifyAdminSession();

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı` };
  }

  const staff = await prisma.staffUser.findUnique({
    where: { id: session.staffId },
  });
  if (!staff || !verifyPassword(currentPassword, staff.passwordHash)) {
    return { error: "Mevcut şifre yanlış" };
  }

  // Sürüm artınca diğer cihazlardaki oturumlar düşer (şifre çalındıysa
  // saldırganın açık oturumu da). Bu cihazın oturumu yeni sürümle yenilenir.
  const updated = await prisma.staffUser.update({
    where: { id: staff.id },
    data: {
      passwordHash: hashPassword(newPassword),
      sessionVersion: { increment: 1 },
    },
    include: { branch: { select: { name: true } } },
  });
  await createStaffSession({
    staffId: updated.id,
    name: updated.name,
    role: updated.role,
    branchId: updated.branchId,
    branchName: updated.branch.name,
    sv: updated.sessionVersion,
  });

  await audit({
    branchId: session.branchId,
    action: "PASSWORD_CHANGED",
    actorName: session.name,
    actorId: session.staffId,
    detail: "Kendi şifresini değiştirdi",
  });

  return { success: true };
}

export async function resetStaffPasswordAction(formData: FormData) {
  const session = await verifyManagerSession();

  const id = String(formData.get("id") || "");
  const newPassword = String(formData.get("newPassword") || "");
  if (!id || newPassword.length < MIN_PASSWORD_LENGTH) return;

  const reset = await prisma.staffUser.updateMany({
    where: { id, ...manageableStaffFilter(session) },
    // Personelin açık oturumları düşer; yeni şifreyle tekrar girmesi gerekir.
    data: {
      passwordHash: hashPassword(newPassword),
      sessionVersion: { increment: 1 },
    },
  });

  if (reset.count > 0) {
    const target = await prisma.staffUser.findUnique({
      where: { id },
      select: { name: true },
    });
    await audit({
      branchId: session.branchId,
      action: "STAFF_PASSWORD_RESET",
      actorName: session.name,
      actorId: session.staffId,
      detail: target?.name ?? id,
    });
  }

  revalidatePath("/admin/personel");
}
