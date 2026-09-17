"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createStaffSession, deleteAdminSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { verifyAdminSession, verifyManagerSession } from "@/lib/dal";
import { rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";

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
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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
    return { error: "Kullanıcı adı veya şifre yanlış" };
  }

  await createStaffSession({
    staffId: staff.id,
    name: staff.name,
    role: staff.role,
    branchId: staff.branchId,
    branchName: staff.branch.name,
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

  if (!name || !username || password.length < 4) {
    return;
  }

  await prisma.staffUser.create({
    data: {
      name,
      username,
      passwordHash: hashPassword(password),
      role,
      branchId: session.branchId,
    },
  });

  revalidatePath("/admin/personel");
}

export async function toggleStaffActiveAction(formData: FormData) {
  const session = await verifyManagerSession();

  const id = String(formData.get("id") || "");
  const isActive = String(formData.get("isActive")) === "true";
  if (!id || id === session.staffId) return; // kendi hesabını pasifleştiremesin

  await prisma.staffUser.updateMany({
    where: { id, branchId: session.branchId },
    data: { isActive: !isActive },
  });

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

  if (newPassword.length < 4) {
    return { error: "Yeni şifre en az 4 karakter olmalı" };
  }

  const staff = await prisma.staffUser.findUnique({
    where: { id: session.staffId },
  });
  if (!staff || !verifyPassword(currentPassword, staff.passwordHash)) {
    return { error: "Mevcut şifre yanlış" };
  }

  await prisma.staffUser.update({
    where: { id: staff.id },
    data: { passwordHash: hashPassword(newPassword) },
  });

  return { success: true };
}

export async function resetStaffPasswordAction(formData: FormData) {
  const session = await verifyManagerSession();

  const id = String(formData.get("id") || "");
  const newPassword = String(formData.get("newPassword") || "");
  if (!id || newPassword.length < 4) return;

  await prisma.staffUser.updateMany({
    where: { id, branchId: session.branchId },
    data: { passwordHash: hashPassword(newPassword) },
  });

  revalidatePath("/admin/personel");
}
