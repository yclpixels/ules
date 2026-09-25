import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getOrCreateOpenOrder } from "@/lib/orders";

type IncomingLine = { productId: string; quantity: number; note: string | null };

/**
 * Müşteri siparişi. İki gövde biçimi kabul edilir:
 *   - { productId, quantity }            → tek kalem (eski biçim)
 *   - { items: [{ productId, quantity, note }] } → sepet
 *
 * Sepet biçimi, müşterinin ürüne dokunur dokunmaz mutfağa sipariş gitmesini
 * önlemek için eklendi: müşteri sepetini toplar, kontrol eder, sonra gönderir.
 */
function parseLines(body: unknown): IncomingLine[] | null {
  const raw = body as Record<string, unknown> | null;
  if (!raw) return null;

  const list = Array.isArray(raw.items)
    ? raw.items
    : [{ productId: raw.productId, quantity: raw.quantity ?? 1, note: raw.note }];

  if (list.length === 0 || list.length > 50) return null;

  const lines: IncomingLine[] = [];
  for (const entry of list) {
    const e = entry as Record<string, unknown>;
    const productId = typeof e?.productId === "string" ? e.productId : "";
    const quantity = Number(e?.quantity ?? 1);
    const note =
      typeof e?.note === "string" ? e.note.trim().slice(0, 200) || null : null;
    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 20
    ) {
      return null;
    }
    lines.push({ productId, quantity, note });
  }
  return lines;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  const { qrToken } = await params;

  // Restoranın tüm müşterileri aynı WiFi/NAT IP'sinden gelir; asıl sınır masa
  // başına, IP sınırı yalnızca dışarıdan gelen kaba saldırılar için geniş.
  const perTable = rateLimit(`masa:table:${qrToken}`, { limit: 40, windowMs: 60 * 1000 });
  const perIp = rateLimit(`masa:ip:${clientIp(req)}`, { limit: 600, windowMs: 60 * 1000 });
  if (!perTable.ok || !perIp.ok) {
    return NextResponse.json({ error: "Çok hızlı, biraz bekleyin" }, { status: 429 });
  }

  const table = await prisma.table.findUnique({
    where: { qrToken },
    include: { branch: { select: { customerOrderingEnabled: true } } },
  });
  if (!table) {
    return NextResponse.json({ error: "Masa bulunamadı" }, { status: 404 });
  }

  // Şube müşteri siparişine kapalıysa (varsayılan) istek buradan öteye geçmez.
  if (!table.branch.customerOrderingEnabled) {
    return NextResponse.json(
      { error: "Bu işletmede QR'dan sipariş kapalı, lütfen personele iletin" },
      { status: 403 }
    );
  }

  const lines = parseLines(await req.json().catch(() => null));
  if (!lines) {
    return NextResponse.json({ error: "Geçersiz sipariş" }, { status: 400 });
  }

  // Ürünler bu şubeye ait ve satışta olmalı; fiyat da buradan alınır
  // (istemciden gelen fiyata güvenilmez).
  const products = await prisma.product.findMany({
    where: {
      id: { in: [...new Set(lines.map((l) => l.productId))] },
      branchId: table.branchId,
      isAvailable: true,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  if (lines.some((l) => !byId.has(l.productId))) {
    return NextResponse.json(
      { error: "Bazı ürünler artık satışta değil, sepetinizi yenileyin" },
      { status: 409 }
    );
  }

  const order = await getOrCreateOpenOrder(table.id);

  await prisma.orderItem.createMany({
    data: lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      quantity: l.quantity,
      unitPriceCents: byId.get(l.productId)!.priceCents,
      note: l.note,
    })),
  });

  return NextResponse.json({ ok: true, added: lines.length });
}
