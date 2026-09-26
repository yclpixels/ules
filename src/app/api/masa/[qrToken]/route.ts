import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PENDING_PAYMENT_TTL_MS,
  settleStalePendingPayments,
  summarizeBill,
} from "@/lib/orders";
import { getMenuData, type MenuDataProduct } from "@/lib/menuData";
import { isCardPaymentActive } from "@/lib/payments";
import {
  LOCALE_LABELS,
  parseLocales,
  pickTranslation,
  resolveLocale,
} from "@/lib/locales";

type ProductWithTranslations = MenuDataProduct;

/**
 * Ürünü istenen dilde döner. Çeviri yoksa temel (ana dil) alanlara düşer —
 * kısmi çeviride bile menü eksiksiz görünür. Fiyat dilden bağımsızdır.
 */
function toMenuProduct(p: ProductWithTranslations, locale: string) {
  const t = pickTranslation(p.translations, locale);
  return {
    id: p.id,
    name: t?.name || p.name,
    priceCents: p.priceCents,
    description: t?.description ?? p.description,
    allergens: t?.allergens ?? p.allergens,
    imageUrl: p.imageUrl,
  };
}

const UNCATEGORIZED_LABEL: Record<string, string> = {
  tr: "Diğer",
  en: "Other",
  de: "Sonstiges",
  ru: "Другое",
  ar: "أخرى",
};

async function getMenu(branchId: string, locale: string) {
  const { categories, uncategorized } = await getMenuData(branchId);

  const groups = categories.map((c) => ({
    id: c.id,
    name: pickTranslation(c.translations, locale)?.name || c.name,
    products: c.products.map((p) => toMenuProduct(p, locale)),
  }));

  if (uncategorized.length > 0) {
    groups.push({
      id: "uncategorized",
      name: UNCATEGORIZED_LABEL[locale] || UNCATEGORIZED_LABEL.tr,
      products: uncategorized.map((p) => toMenuProduct(p, locale)),
    });
  }

  return groups;
}

type BranchInfo = {
  /** Müşteri ekranının başlığında restoranın adı. */
  name: string;
  tipPresets: number[];
  googleReviewUrl: string | null;
  cardPaymentEnabled: boolean;
  customerOrderingEnabled: boolean;
  /** Bu şubede sunulan diller; tek dil varsa arayüzde seçici gösterilmez. */
  locales: { code: string; label: string }[];
  locale: string;
  websiteUrl: string | null;
};

function parseTipPresets(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 100);
}

/** Hesap ekranı için sipariş: kalemler + tüm ödemeler tek sorguda (toplamlar bellekte). */
const billInclude = {
  items: {
    where: { removedAt: null },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  },
  payments: { orderBy: { createdAt: "desc" } },
} as const;

/**
 * Masanın gösterilecek hesabı: açık hesap varsa o, yoksa en son kapanan
 * (fiş linkine erişilsin diye, yeni sipariş başlayana kadar). Tek sorgu:
 * açık hesabın closedAt'i boş olduğu için "boşlar önce" sıralamasında başa gelir.
 */
function findBillOrder(tableId: string) {
  return prisma.order.findFirst({
    where: { tableId, status: { in: ["OPEN", "CLOSED"] } },
    orderBy: { closedAt: { sort: "desc", nulls: "first" } },
    include: billInclude,
  });
}

type BillOrder = NonNullable<Awaited<ReturnType<typeof findBillOrder>>>;

function buildBillResponse(
  table: { id: string; name: string },
  order: BillOrder,
  menu: Awaited<ReturnType<typeof getMenu>>,
  branch: BranchInfo
) {
  const { totalCents, paidCents, tipCents, remainingCents } = summarizeBill(
    order.items,
    order.payments
  );
  const items = order.items;
  const payments = order.payments.filter((p) => p.status === "PAID");

  return {
    table,
    orderId: order.id,
    items: items.map((i) => ({
      id: i.id,
      name: i.product.name,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      note: i.note,
      // Bu kalemi masadan biri üstlendi mi (kaleme göre bölmede tekrar seçilemez).
      // Boolean(): alan null da olabilir undefined de (eski istemci/önbellek);
      // "!== null" yazımı undefined'ı yanlışlıkla "ödenmiş" sayıyordu.
      settled: Boolean(i.settledPaymentId),
    })),
    payments: payments.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      tipCents: p.tipCents,
      payerName: p.payerName,
    })),
    totalCents,
    paidCents,
    tipCents,
    remainingCents,
    closed: remainingCents === 0 && items.length > 0,
    menu,
    branch,
  };
}

/**
 * Müşteri ekranı bunu 4 sn'de bir çağırır — hız burada önemli. Veritabanına
 * iki tur: (1) masa + şube, (2) menü (önbellekten) ve hesap aynı anda.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  const { qrToken } = await params;
  const table = await prisma.table.findUnique({
    where: { qrToken },
    include: { branch: true },
  });
  if (!table) {
    return NextResponse.json({ error: "Masa bulunamadı" }, { status: 404 });
  }

  const available = parseLocales(table.branch.supportedLocales);
  const locale = resolveLocale(
    new URL(req.url).searchParams.get("lang"),
    available
  );

  const [menu, found] = await Promise.all([
    getMenu(table.branchId, locale),
    findBillOrder(table.id),
  ]);
  let order = found;

  // Yarım kalmış bir kartlı ödeme kalemleri kilitliyorsa serbest bırak
  // (nadir: yalnızca süresi geçmiş askıda ödeme varsa ek sorgu atılır).
  const staleBefore = Date.now() - PENDING_PAYMENT_TTL_MS;
  if (
    order?.status === "OPEN" &&
    order.payments.some((p) => p.status === "PENDING" && p.createdAt.getTime() < staleBefore)
  ) {
    await settleStalePendingPayments({ orderId: order.id });
    order = await findBillOrder(table.id);
  }

  const branch: BranchInfo = {
    name: table.branch.name,
    tipPresets: parseTipPresets(table.branch.tipPresets),
    googleReviewUrl: table.branch.googleReviewUrl,
    // Alt üye kaydı olmayan şubede buton hiç gösterilmez (bkz. isCardPaymentActive).
    cardPaymentEnabled: isCardPaymentActive(table.branch),
    customerOrderingEnabled: table.branch.customerOrderingEnabled,
    locales: available.map((code) => ({
      code,
      label: LOCALE_LABELS[code] || code,
    })),
    locale,
    websiteUrl: table.branch.websiteUrl,
  };
  const tableInfo = { id: table.id, name: table.name };

  if (order) {
    return NextResponse.json(buildBillResponse(tableInfo, order, menu, branch));
  }

  return NextResponse.json({
    table: tableInfo,
    orderId: null,
    items: [],
    payments: [],
    totalCents: 0,
    paidCents: 0,
    tipCents: 0,
    remainingCents: 0,
    closed: false,
    menu,
    branch,
  });
}
