"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  cancelOrder,
  getOrCreateOpenOrder,
  payTowardsOrderInstant,
  voidPayment,
} from "@/lib/orders";
import { formatTL, parseTLInputToCents } from "@/lib/money";
import {
  verifyAdminSession,
  verifyManagerSession,
  verifyOwnerSession,
} from "@/lib/dal";
import { addDays, startOfDayInIstanbul } from "@/lib/dates";
import { audit } from "@/lib/audit";
import { hashPassword } from "@/lib/passwords";
import { parseLocales, SUPPORTED_LOCALES } from "@/lib/locales";
import { isValidSlug, slugify } from "@/lib/slug";
import { sendEmail } from "@/lib/email";
import { clientIpFromHeaders, rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";
import { createSubMerchant } from "@/lib/payments/iyzico";
import { needsSubMerchant } from "@/lib/payments";
import { escapeHtml } from "@/lib/receipt";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { encryptField, hasFieldEncryptionKey } from "@/lib/fieldCrypto";

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
  if (imageInput.startsWith("/api/uploads/")) {
    // Kendi yüklediğimiz görsel: göreli yol olarak saklanır ki alan adı
    // değişince (test → prod) linkler bozulmasın.
    imageUrl = imageInput;
  } else if (imageInput) {
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
  // Sıra numarası verilmezse hepsi 0 olup menüde rastgele sıralanıyordu;
  // yeni kategoriyi listenin sonuna koy.
  const last = await prisma.category.findFirst({
    where: { branchId: session.branchId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  await prisma.category.create({
    data: { name, branchId: session.branchId, sortOrder: (last?.sortOrder ?? 0) + 1 },
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

  // Sadece açık hesaptan, henüz kimsenin ödemediği kalem silinebilir.
  // Kapanmış hesabın kalemi silinirse ödemesi alınmış hesabın geçmişi
  // değişir (tahsil edilen para ile hesap tutmaz); kalem bazlı ödenmiş
  // kalemi silmek de ödenen tutarı boşa düşürür.
  await prisma.orderItem.updateMany({
    where: {
      id,
      removedAt: null,
      settledPaymentId: null,
      order: { status: "OPEN", table: { id: tableId, branchId: session.branchId } },
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

  // status: "OPEN" şart — hesap bu arada başka bir garson tarafından
  // kapatıldıysa payTowardsOrderInstant throw eder ve garson hata sayfası görür.
  const order = await prisma.order.findFirst({
    where: { id: orderId, status: "OPEN", table: { branchId: session.branchId } },
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

  const cancelled = await cancelOrder(orderId, session.name);

  if (cancelled) {
    const table = await prisma.table.findUnique({
      where: { id: order.tableId },
      select: { name: true },
    });
    await audit({
      branchId: session.branchId,
      action: "ORDER_CANCELLED",
      actorName: session.name,
      actorId: session.staffId,
      detail: `${table?.name ?? order.tableId} — hesap no ${orderId}`,
    });
  }

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

  const voided = await voidPayment(paymentId, session.name);

  if (voided) {
    await audit({
      branchId: session.branchId,
      action: "PAYMENT_VOIDED",
      actorName: session.name,
      actorId: session.staffId,
      detail: `${formatTL(payment.amountCents)} — ödeme no ${paymentId}`,
    });
  }

  revalidatePath(`/admin/masalar/${tableId}`);
  revalidatePath("/admin");
}

/** Sadece http(s) adreslerini kabul eder (javascript: vb. müşteri ekranına gitmesin). */
function safeHttpUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

/** Şube ayarları: Google yorum linki ve bahşiş yüzdeleri (sadece müdür). */
export async function updateBranchSettingsAction(formData: FormData) {
  const session = await verifyManagerSession();
  const tipPresetsInput = String(formData.get("tipPresets") || "");

  // Geçersiz bir girdi mevcut değeri SİLMEZ: alan olduğu gibi kalır ve müdüre
  // hangi alanın kaydedilmediği söylenir. Önceden yazım hatası olan bir link
  // ya da başka şubenin kullandığı menü adresi, yayındaki değeri sessizce
  // siliyordu (menü yayından kalkıyordu).
  const errors: string[] = [];

  // Sadece http(s) linki kabul et (javascript: vb. müşteri ekranına gitmesin).
  // undefined = alana dokunma, null = bilerek boşaltıldı.
  const urlField = (key: string, errorCode: string): string | null | undefined => {
    const input = String(formData.get(key) || "").trim();
    if (!input) return null;
    const url = safeHttpUrl(input);
    if (!url) errors.push(errorCode);
    return url ?? undefined;
  };
  const googleReviewUrl = urlField("googleReviewUrl", "yorum-linki");
  const websiteUrl = urlField("websiteUrl", "site-linki");

  const tipPresets = tipPresetsInput
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 100)
    .slice(0, 4)
    .join(",");

  // Kartlı ödeme yalnızca o şube için gerçek bir üye işyeri anlaşması
  // varken açılmalı; varsayılan kapalı. iyzico'da alt üye kaydı yoksa para
  // platformun hesabına düşeceği için açılmasına izin verilmez.
  const wantsCardPayment = String(formData.get("cardPaymentEnabled")) === "on";
  const current = await prisma.branch.findUniqueOrThrow({
    where: { id: session.branchId },
    select: { subMerchantKey: true },
  });
  if (wantsCardPayment && needsSubMerchant(current)) errors.push("alt-uye-yok");
  const cardPaymentEnabled = wantsCardPayment && !needsSubMerchant(current);
  // Müşterinin QR'dan kendi siparişini verebilmesi; pilotta kapalı başlar.
  const customerOrderingEnabled =
    String(formData.get("customerOrderingEnabled")) === "on";

  // Herkese açık menü adresi. Boş bırakılırsa sayfa yayından kalkar.
  // Geçersizse ya da başka bir şube kullanıyorsa mevcut adres korunur.
  const slugInput = String(formData.get("menuSlug") || "").trim().toLowerCase();
  let menuSlug: string | null | undefined = null;
  if (slugInput) {
    const candidate = isValidSlug(slugInput) ? slugInput : slugify(slugInput);
    if (!isValidSlug(candidate)) {
      menuSlug = undefined;
      errors.push("menu-adresi-gecersiz");
    } else {
      const taken = await prisma.branch.findFirst({
        where: { menuSlug: candidate, NOT: { id: session.branchId } },
        select: { id: true },
      });
      menuSlug = taken ? undefined : candidate;
      if (taken) errors.push("menu-adresi-dolu");
    }
  }

  // Menü dilleri: ilki ana dil (Product/Category'deki temel alanlar).
  const supportedLocales = parseLocales(
    String(formData.getAll("locales").join(","))
  ).join(",");

  // KVKK aydınlatma metninde görünecek veri sorumlusu bilgileri.
  const text = (key: string, max: number) =>
    String(formData.get(key) || "").trim().slice(0, max) || null;

  try {
    await prisma.branch.update({
      where: { id: session.branchId },
      data: {
        googleReviewUrl,
        tipPresets,
        cardPaymentEnabled,
        customerOrderingEnabled,
        supportedLocales,
        menuSlug,
        websiteUrl,
        alertEmail: text("alertEmail", 150),
        legalName: text("legalName", 200),
        legalAddress: text("legalAddress", 400),
        contactEmail: text("contactEmail", 150),
        contactPhone: text("contactPhone", 40),
      },
    });
  } catch (err) {
    // Kontrolle kayıt arasında başka bir şube aynı menü adresini aldıysa.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      redirect("/admin/ayarlar?hata=menu-adresi-dolu,kaydedilmedi");
    }
    throw err;
  }

  await audit({
    branchId: session.branchId,
    action: "SETTINGS_UPDATED",
    actorName: session.name,
    actorId: session.staffId,
  });

  revalidatePath("/admin/ayarlar");
  revalidatePath("/gizlilik");

  // Başarılı kayıtta da yönlendiriyoruz ki önceki hata bandı adreste kalmasın.
  redirect(errors.length ? `/admin/ayarlar?hata=${errors.join(",")}` : "/admin/ayarlar");
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
  await audit({
    branchId: session.branchId,
    action: "DAY_CLOSED",
    actorName: session.name,
    actorId: session.staffId,
    detail: `${date} — sayılan nakit ${formatTL(countedCents)}, sistemdeki ${formatTL(day.cashCents)}`,
  });

  revalidatePath("/admin/gun-sonu");
}

/**
 * Platform sahibi (biz) bir işletmenin abonelik durumunu günceller.
 * Tahsilat kodda değil — burada sadece "hangi şube ne durumda" tutulur.
 */
export async function updateSubscriptionAction(formData: FormData) {
  const session = await verifyOwnerSession();
  const branchId = String(formData.get("branchId") || "");
  if (!branchId) return;

  const statusInput = String(formData.get("subscriptionStatus") || "");
  const subscriptionStatus =
    statusInput === "ACTIVE" || statusInput === "SUSPENDED" || statusInput === "TRIAL"
      ? statusInput
      : undefined;
  if (!subscriptionStatus) return;

  const trialInput = String(formData.get("trialEndsAt") || "").trim();
  // Tarih İstanbul günü olarak girilir; günün sonuna kadar geçerli sayılır.
  const trialStart = trialInput ? startOfDayInIstanbul(trialInput) : null;
  const trialEndsAt = trialStart ? addDays(trialStart, 1) : null;

  const feeCents = parseTLInputToCents(String(formData.get("monthlyFee") || ""));
  const note =
    String(formData.get("subscriptionNote") || "").trim().slice(0, 300) || null;

  // Platform komisyonu: yüzde olarak girilir, baz puana çevrilir (%2,5 → 250).
  // Sözleşmeyle belirlenene kadar 0 kalır — o zamana kadar tahsilatın
  // tamamı şubeye gider (bkz. pay/route.ts).
  const commissionInput = String(formData.get("platformCommissionPercent") || "")
    .trim()
    .replace(",", ".");
  const commissionPercent = Number.parseFloat(commissionInput);
  const platformCommissionBp =
    Number.isFinite(commissionPercent) && commissionPercent >= 0 && commissionPercent <= 100
      ? Math.round(commissionPercent * 100)
      : 0;

  await prisma.branch.update({
    where: { id: branchId },
    data: {
      subscriptionStatus,
      trialEndsAt,
      monthlyFeeCents: feeCents > 0 ? feeCents : null,
      subscriptionNote: note,
      platformCommissionBp,
    },
  });

  await audit({
    branchId,
    action: "SETTINGS_UPDATED",
    actorName: session.name,
    actorId: session.staffId,
    detail: `Abonelik durumu: ${subscriptionStatus}${
      trialInput ? ` (deneme bitişi ${trialInput})` : ""
    }`,
  });

  revalidatePath("/admin/isletmeler");
}

/** Müdür düşük puanı gördü olarak işaretler; uyarı bandından düşer. */
export async function acknowledgeFeedbackAction(formData: FormData) {
  const session = await verifyManagerSession();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.feedback.updateMany({
    where: { id, branchId: session.branchId, acknowledgedAt: null },
    data: { acknowledgedAt: new Date(), acknowledgedBy: session.name },
  });

  revalidatePath("/admin/degerlendirmeler");
  revalidatePath("/admin");
}

/**
 * Bir ürünün ya da kategorinin çevirisini kaydeder (sadece müdür).
 * Boş bırakılan alan çeviriyi siler — menü o dilde ana dile düşer.
 */
export async function saveTranslationAction(formData: FormData) {
  const session = await verifyManagerSession();
  const kind = String(formData.get("kind") || "");
  const targetId = String(formData.get("targetId") || "");
  const locale = String(formData.get("locale") || "").trim().toLowerCase();
  if (!targetId || !SUPPORTED_LOCALES.includes(locale as never)) return;

  const name = String(formData.get("name") || "").trim().slice(0, 120);

  if (kind === "category") {
    const category = await prisma.category.findFirst({
      where: { id: targetId, branchId: session.branchId },
    });
    if (!category) return;

    if (!name) {
      await prisma.categoryTranslation.deleteMany({
        where: { categoryId: targetId, locale },
      });
    } else {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: targetId, locale } },
        create: { categoryId: targetId, locale, name },
        update: { name },
      });
    }
    revalidatePath("/admin/urunler");
    return;
  }

  const product = await prisma.product.findFirst({
    where: { id: targetId, branchId: session.branchId },
  });
  if (!product) return;

  const description =
    String(formData.get("description") || "").trim().slice(0, 300) || null;
  const allergens =
    String(formData.get("allergens") || "").trim().slice(0, 120) || null;

  // Ad boşsa çeviri tamamen kaldırılır: yarım çeviri kafa karıştırır.
  if (!name) {
    await prisma.productTranslation.deleteMany({
      where: { productId: targetId, locale },
    });
  } else {
    await prisma.productTranslation.upsert({
      where: { productId_locale: { productId: targetId, locale } },
      create: { productId: targetId, locale, name, description, allergens },
      update: { name, description, allergens },
    });
  }
  revalidatePath("/admin/urunler");
}

export type CreateBranchState = { error?: string; success?: string } | undefined;

/**
 * Yeni işletme (şube) açar ve ilk müdür hesabını oluşturur — sadece sahip.
 *
 * Daha önce bu iş `npm run db:seed`'i farklı env değerleriyle çalıştırmayı
 * gerektiriyordu; üstelik seed örnek ürünleri de ekliyordu ve restoran onları
 * tek tek silmek zorunda kalıyordu. Burada demo veri oluşturulmaz.
 */
export async function createBranchAction(
  _prev: CreateBranchState,
  formData: FormData
): Promise<CreateBranchState> {
  const session = await verifyOwnerSession();

  const name = String(formData.get("name") || "").trim();
  const managerName = String(formData.get("managerName") || "").trim();
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !managerName || !username) {
    return { error: "İşletme adı, müdür adı ve kullanıcı adı zorunlu" };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı` };
  }
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return {
      error: "Kullanıcı adı 3-30 karakter olmalı ve harf/rakam/nokta içermeli",
    };
  }

  const taken = await prisma.staffUser.findUnique({ where: { username } });
  if (taken) {
    return { error: "Bu kullanıcı adı zaten kullanılıyor" };
  }

  // Şube ve ilk müdür tek işlemde: yarım kalmış şube (müdürsüz) bırakmayalım.
  const branch = await prisma.$transaction(async (tx) => {
    const created = await tx.branch.create({ data: { name } });
    await tx.staffUser.create({
      data: {
        name: managerName,
        username,
        passwordHash: hashPassword(password),
        role: "MANAGER",
        branchId: created.id,
      },
    });
    return created;
  });

  await audit({
    branchId: branch.id,
    action: "STAFF_ADDED",
    actorName: session.name,
    actorId: session.staffId,
    detail: `Yeni işletme açıldı: ${name} — müdür ${managerName} (${username})`,
  });

  revalidatePath("/admin/isletmeler");
  return {
    success: `"${name}" açıldı. Müdür girişi: ${username}`,
  };
}

/** Mutfak: kalemi hazırlandı olarak işaretler (her personel yapabilir). */
export async function markItemPreparedAction(formData: FormData) {
  const session = await verifyAdminSession();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.orderItem.updateMany({
    where: {
      id,
      preparedAt: null,
      removedAt: null,
      order: { table: { branchId: session.branchId } },
    },
    data: { preparedAt: new Date(), preparedBy: session.name },
  });

  revalidatePath("/admin/mutfak");
}

export type SubMerchantState = { error?: string; success?: string } | undefined;

/**
 * Şubeyi iyzico Pazaryeri'nde "alt üye işyeri" olarak kaydeder/günceller.
 * Bundan sonra kartlı ödeme tahsilatı platformun değil, doğrudan bu şubenin
 * hesabına düşer (bkz. lib/payments/iyzico.ts createSubMerchant).
 *
 * DİKKAT: iyzico hesabı Pazaryeri'ne onaylanmadan bu çağrı hata döner —
 * bu beklenen bir durumdur, onay sonrası tekrar denenmelidir.
 */
export async function saveSubMerchantAction(
  _prev: SubMerchantState,
  formData: FormData
): Promise<SubMerchantState> {
  const session = await verifyManagerSession();

  const subMerchantType = String(formData.get("subMerchantType") || "");
  if (
    subMerchantType !== "PERSONAL" &&
    subMerchantType !== "PRIVATE_COMPANY" &&
    subMerchantType !== "LIMITED_OR_JOINT_STOCK_COMPANY"
  ) {
    return { error: "İşletme türü seçilmeli" };
  }

  const iban = String(formData.get("ibanNumber") || "").trim();
  const email = String(formData.get("contactEmail") || "").trim();
  const gsmNumber = String(formData.get("contactPhone") || "").trim();
  const address = String(formData.get("legalAddress") || "").trim();
  const name = String(formData.get("legalName") || "").trim();
  const taxOffice = String(formData.get("taxOffice") || "").trim() || undefined;
  const taxNumber = String(formData.get("taxNumber") || "").trim() || undefined;
  const identityNumber =
    String(formData.get("identityNumber") || "").trim() || undefined;

  if (!iban || !email || !gsmNumber || !address || !name) {
    return {
      error:
        "IBAN, iletişim e-postası, telefon, adres ve işletme unvanı zorunlu",
    };
  }
  if (subMerchantType === "PERSONAL" && !identityNumber) {
    return { error: "Şahıs işletmesi için TC kimlik no zorunlu" };
  }
  if (
    (subMerchantType === "PRIVATE_COMPANY" ||
      subMerchantType === "LIMITED_OR_JOINT_STOCK_COMPANY") &&
    !taxOffice
  ) {
    return { error: "Şirket için vergi dairesi zorunlu" };
  }
  if (subMerchantType === "LIMITED_OR_JOINT_STOCK_COMPANY" && !taxNumber) {
    return { error: "Limited/anonim şirket için vergi numarası zorunlu" };
  }

  // iyzico'ya kayıt yapıp sonra IBAN/TC'yi saklayamamak yarım iş bırakır;
  // şifreleme anahtarı yoksa en baştan dur.
  if (!hasFieldEncryptionKey()) {
    return {
      error:
        "Sunucuda FIELD_ENCRYPTION_KEY tanımlı değil — IBAN/TC kimlik no şifrelenmeden saklanamaz. Platform yöneticisine bildirin.",
    };
  }

  const [contactName, ...rest] = name.split(" ");
  const contactSurname = rest.join(" ") || contactName;

  const result = await createSubMerchant({
    branchId: session.branchId,
    subMerchantType,
    name,
    email,
    gsmNumber,
    address,
    iban,
    legalCompanyTitle: name,
    contactName,
    contactSurname,
    taxOffice,
    taxNumber,
    identityNumber,
  });

  if (!result.success) {
    return { error: result.error };
  }

  await prisma.branch.update({
    where: { id: session.branchId },
    data: {
      subMerchantType,
      ibanNumber: encryptField(iban),
      taxOffice: taxOffice ?? null,
      taxNumber: taxNumber ?? null,
      identityNumber: encryptField(identityNumber),
      subMerchantKey: result.subMerchantKey,
      subMerchantSyncedAt: new Date(),
    },
  });

  await audit({
    branchId: session.branchId,
    action: "SETTINGS_UPDATED",
    actorName: session.name,
    actorId: session.staffId,
    detail: "iyzico alt üye işyeri kaydedildi",
  });

  revalidatePath("/admin/ayarlar");
  return { success: "Alt üye işyeri kaydedildi. Kartlı ödemeler artık bu şubenin hesabına gidecek." };
}

export type ContactRequestState = { error?: string; success?: boolean } | undefined;

/**
 * Tanıtım sitesindeki "Demo isteyin" formu. Girişli oturum gerektirmez,
 * bu yüzden IP başına hız sınırı var. Gönderilen e-posta CONTACT_EMAIL'e
 * gider; env tanımlı değilse (henüz gerçek bir adres yoksa) mock modda
 * konsola düşer — sendEmail() zaten bunu kendi başına hallediyor.
 */
export async function sendContactRequestAction(
  _prev: ContactRequestState,
  formData: FormData
): Promise<ContactRequestState> {
  // Botlar genelde bu alanı da doldurur; insan kullanıcı görmez (bkz. form).
  if (String(formData.get("website") || "").trim()) {
    return { success: true };
  }

  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const limited = rateLimit(`contact:ip:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return { error: "Çok fazla istek gönderildi, biraz sonra tekrar deneyin" };
  }

  const businessName = String(formData.get("businessName") || "").trim().slice(0, 150);
  const contact = String(formData.get("contact") || "").trim().slice(0, 200);
  const message = String(formData.get("message") || "").trim().slice(0, 2000);

  if (!businessName || !contact) {
    return { error: "İşletme adı ve iletişim bilgisi zorunlu" };
  }

  // Form herkese açık: girdiler kaçışlanmadan HTML'e konursa gelen kutusunda
  // sahte link/içerik (phishing) gösterilebilirdi.
  await sendEmail({
    to: process.env.CONTACT_EMAIL || "demo@ules.com.tr",
    subject: `Demo talebi: ${businessName.replace(/[\r\n]+/g, " ")}`,
    html: `
      <p><strong>İşletme:</strong> ${escapeHtml(businessName)}</p>
      <p><strong>İletişim:</strong> ${escapeHtml(contact)}</p>
      <p><strong>Mesaj:</strong> ${message ? escapeHtml(message).replace(/\n/g, "<br>") : "(boş)"}</p>
    `,
  });

  return { success: true };
}
