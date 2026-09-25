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

  // Kullanıcı adı tüm şubelerde tekil; çakışırsa Prisma P2002 fırlatır ve
  // müdür beyaz hata sayfası görürdü — yakalayıp forma geri dönüyoruz.
  try {
    await prisma.staffUser.create({
      data: {
        name,
        username,
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
      redirect("/admin/personel?hata=kullanici-mevcut");
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

export async function toggleStaffActiveAction(formData: FormData) {
  const session = await verifyManagerSession();

  const id = String(formData.get("id") || "");
  const isActive = String(formData.get("isActive")) === "true";
  if (!id || id === session.staffId) return; // kendi hesabını pasifleştiremesin

  const updated = await prisma.staffUser.updateMany({
    where: { id, branchId: session.branchId },
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
    where: { id, branchId: session.branchId },
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
