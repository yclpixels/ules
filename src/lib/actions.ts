"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  cancelOrder,
  getOrCreateOpenOrder,
  payTowardsOrderInstant,
  voidPayment,
} from "@/lib/orders";
import { parseTLInputToCents } from "@/lib/money";
import { verifyAdminSession, verifyManagerSession } from "@/lib/dal";

export async function addTableAction(formData: FormData) {
  const session = await verifyManagerSession();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.table.create({ data: { name, branchId: session.branchId } });
  revalidatePath("/admin/masalar");
}

export async function updateTableAction(formData: FormData) {
  const session = await verifyManagerSession();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return;
  await prisma.table.updateMany({
    where: { id, branchId: session.branchId },
    data: { name },
  });
  revalidatePath("/admin/masalar");
}

export async function deleteTableAction(formData: FormData) {
  const session = await verifyManagerSession();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const table = await prisma.table.findFirst({
    where: { id, branchId: session.branchId },
    include: { _count: { select: { orders: true } } },
  });
  if (!table || table._count.orders > 0) return; // geçmişi olan masa silinemez

  await prisma.table.delete({ where: { id } });
  revalidatePath("/admin/masalar");
}

/** Ürün formundaki opsiyonel alanlar: açıklama, alerjen, görsel linki (sadece http(s)). */
function parseProductExtras(formData: FormData) {
  const description =
    String(formData.get("description") || "").trim().slice(0, 300) || null;
  const allergens =
    String(formData.get("allergens") || "").trim().slice(0, 120) || null;
  const imageInput = String(formData.get("imageUrl") || "").trim();
  let imageUrl: string | null = null;
  if (imageInput) {
    try {
      const u = new URL(imageInput);
      if (u.protocol === "https:" || u.protocol === "http:") imageUrl = u.toString();
    } catch {
      /* geçersiz link → boş */
    }
  }
  return { description, allergens, imageUrl };
}

export async function addProductAction(formData: FormData) {
  const session = await verifyManagerSession();
  const name = String(formData.get("name") || "").trim();
  const priceInput = String(formData.get("price") || "");
  const categoryIdInput = String(formData.get("categoryId") || "") || null;
  const priceCents = parseTLInputToCents(priceInput);
  if (!name || priceCents <= 0) return;
  const extras = parseProductExtras(formData);

  const category = categoryIdInput
    ? await prisma.category.findFirst({
        where: { id: categoryIdInput, branchId: session.branchId },
      })
    : null;

  await prisma.product.create({
    data: {
      name,
      priceCents,
      categoryId: category?.id,
      branchId: session.branchId,
      ...extras,
    },
  });
  revalidatePath("/admin/urunler");
}

export async function toggleProductAvailabilityAction(formData: FormData) {
  const session = await verifyManagerSession();
  const id = String(formData.get("id") || "");
  const isAvailable = String(formData.get("isAvailable")) === "true";
  if (!id) return;
  await prisma.product.updateMany({
    where: { id, branchId: session.branchId },
    data: { isAvailable: !isAvailable },
  });
  revalidatePath("/admin/urunler");
}

export async function updateProductAction(formData: FormData) {
  const session = await verifyManagerSession();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const priceInput = String(formData.get("price") || "");
  const categoryIdInput = String(formData.get("categoryId") || "") || null;
  const priceCents = parseTLInputToCents(priceInput);
  if (!id || !name || priceCents <= 0) return;
  const extras = parseProductExtras(formData);

  const category = categoryIdInput
    ? await prisma.category.findFirst({
        where: { id: categoryIdInput, branchId: session.branchId },
      })
    : null;

  await prisma.product.updateMany({
    where: { id, branchId: session.branchId },
    data: { name, priceCents, categoryId: category?.id ?? null, ...extras },
  });
  revalidatePath("/admin/urunler");
}

export async function deleteProductAction(formData: FormData) {
  const session = await verifyManagerSession();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const product = await prisma.product.findFirst({
    where: { id, branchId: session.branchId },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product || product._count.orderItems > 0) return; // sipariş geçmişi olan ürün silinemez

  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/urunler");
}

export async function addCategoryAction(formData: FormData) {
  const session = await verifyManagerSession();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.category.create({
    data: { name, branchId: session.branchId },
  });
  revalidatePath("/admin/urunler");
}

export async function updateCategoryAction(formData: FormData) {
  const session = await verifyManagerSession();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const sortOrderRaw = Number(formData.get("sortOrder"));
  const sortOrder = Number.isInteger(sortOrderRaw) ? sortOrderRaw : undefined;
  if (!id || !name) return;
  await prisma.category.updateMany({
    where: { id, branchId: session.branchId },
    data: { name, sortOrder },
  });
  revalidatePath("/admin/urunler");
}

export async function deleteCategoryAction(formData: FormData) {
  const session = await verifyManagerSession();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const category = await prisma.category.findFirst({
    where: { id, branchId: session.branchId },
  });
  if (!category) return;

  // Kategoriye ait ürünleri silmek yerine "kategorisiz" yapıyoruz.
  await prisma.product.updateMany({
    where: { categoryId: id },
    data: { categoryId: null },
  });
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/urunler");
}

export async function addOrderItemAction(formData: FormData) {
  const session = await verifyAdminSession();
  const tableId = String(formData.get("tableId") || "");
  const productId = String(formData.get("productId") || "");
  const quantity = Number(formData.get("quantity") || 1);
  const note = String(formData.get("note") || "").trim().slice(0, 200) || null;
  if (!tableId || !productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;

  const table = await prisma.table.findFirst({
    where: { id: tableId, branchId: session.branchId },
  });
  const product = await prisma.product.findFirst({
    where: { id: productId, branchId: session.branchId },
  });
  if (!table || !product) return;

  const order = await getOrCreateOpenOrder(table.id);

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId,
      quantity,
      unitPriceCents: product.priceCents,
      addedBy: session.name,
      note,
    },
  });

  revalidatePath(`/admin/masalar/${tableId}`);
}

export async function removeOrderItemAction(formData: FormData) {
  const session = await verifyAdminSession();
  const id = String(formData.get("id") || "");
  const tableId = String(formData.get("tableId") || "");
  if (!id) return;

  await prisma.orderItem.updateMany({
    where: {
      id,
      removedAt: null,
      order: { table: { id: tableId, branchId: session.branchId } },
    },
    data: { removedAt: new Date(), removedBy: session.name },
  });

  revalidatePath(`/admin/masalar/${tableId}`);
}

/**
 * Personelin masada aldığı ödemeyi kaydeder: nakit ya da restoranın kendi
 * POS/kart cihazından (temassız/NFC dahil) alınan kart ödemesi. Kartın
 * kendisi bizim sistemimizden geçmiyor — sadece "bu tutar şu şekilde
 * alındı" kaydı düşülüyor, tutarlılık ve raporlama için.
 */
export async function recordManualPaymentAction(formData: FormData) {
  const session = await verifyAdminSession();
  const tableId = String(formData.get("tableId") || "");
  const orderId = String(formData.get("orderId") || "");
  const amountInput = String(formData.get("amount") || "");
  const payerName =
    String(formData.get("payerName") || "").trim().slice(0, 60) || undefined;
  const method = String(formData.get("method") || "CASH") === "CARD" ? "CARD" : "CASH";
  const amountCents = parseTLInputToCents(amountInput);
  // Bahşiş ayrı alan: tahsil edilen toplam = hesap payı + bahşiş
  const tipCents = parseTLInputToCents(String(formData.get("tip") || ""));

  if (!orderId || !amountCents || amountCents <= 0) return;

  const order = await prisma.order.findFirst({
    where: { id: orderId, table: { branchId: session.branchId } },
  });
  if (!order) return;

  await payTowardsOrderInstant(
    orderId,
    amountCents + tipCents,
    payerName,
    method,
    session.name,
    tipCents
  );

  revalidatePath(`/admin/masalar/${tableId}`);
  revalidatePath("/admin");
}

/**
 * Hesabı ödeme almadan kapatır (müşteri kalktı, ikram, yanlış açıldı).
 * Sadece müdür; kalan tutar tahsil edilmemiş sayılır, raporda "İptal" görünür.
 */
export async function cancelOrderAction(formData: FormData) {
  const session = await verifyManagerSession();
  const tableId = String(formData.get("tableId") || "");
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) return;

  const order = await prisma.order.findFirst({
    where: { id: orderId, status: "OPEN", table: { branchId: session.branchId } },
  });
  if (!order) return;

  await cancelOrder(orderId, session.name);

  revalidatePath(`/admin/masalar/${tableId}`);
  revalidatePath("/admin");
}

/** Yanlış girilen nakit/POS ödemesini iptal eder (sadece müdür). */
export async function voidPaymentAction(formData: FormData) {
  const session = await verifyManagerSession();
  const tableId = String(formData.get("tableId") || "");
  const paymentId = String(formData.get("paymentId") || "");
  if (!paymentId) return;

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, order: { table: { branchId: session.branchId } } },
  });
  if (!payment) return;

  await voidPayment(paymentId, session.name);

  revalidatePath(`/admin/masalar/${tableId}`);
  revalidatePath("/admin");
}

/** Şube ayarları: Google yorum linki ve bahşiş yüzdeleri (sadece müdür). */
export async function updateBranchSettingsAction(formData: FormData) {
  const session = await verifyManagerSession();
  const googleReviewUrlInput = String(formData.get("googleReviewUrl") || "").trim();
  const tipPresetsInput = String(formData.get("tipPresets") || "");

  // Sadece http(s) linki kabul et (javascript: vb. müşteri ekranına gitmesin)
  let googleReviewUrl: string | null = null;
  if (googleReviewUrlInput) {
    try {
      const parsed = new URL(googleReviewUrlInput);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        googleReviewUrl = parsed.toString();
      }
    } catch {
      /* geçersiz link → boş bırak */
    }
  }

  const tipPresets = tipPresetsInput
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 100)
    .slice(0, 4)
    .join(",");

  await prisma.branch.update({
    where: { id: session.branchId },
    data: { googleReviewUrl, tipPresets },
  });
  revalidatePath("/admin/ayarlar");
}

/** Gün sonu kasa kapanışı (sadece müdür): sayılan nakit kaydedilir, fark hesaplanır. */
export async function closeDayAction(formData: FormData) {
  const session = await verifyManagerSession();
  const date = String(formData.get("date") || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const countedCents = parseTLInputToCents(String(formData.get("countedCash") || "0"));
  const note = String(formData.get("note") || "").trim().slice(0, 300) || null;

  const { getDayData } = await import("@/lib/reports");
  const day = await getDayData(session.branchId, date);
  if (!day) return;

  await prisma.dayClose.upsert({
    where: { branchId_date: { branchId: session.branchId, date } },
    create: {
      branchId: session.branchId,
      date,
      expectedCashCents: day.cashCents,
      countedCashCents: countedCents,
      cardCents: day.posCardCents,
      onlineCents: day.onlineCents,
      tipCents: day.tipCents,
      note,
      closedBy: session.name,
    },
    update: {
      expectedCashCents: day.cashCents,
      countedCashCents: countedCents,
      cardCents: day.posCardCents,
      onlineCents: day.onlineCents,
      tipCents: day.tipCents,
      note,
      closedBy: session.name,
    },
  });
  revalidatePath("/admin/gun-sonu");
}
