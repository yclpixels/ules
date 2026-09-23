import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getOrCreateOpenOrder } from "@/lib/orders";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  const { qrToken } = await params;
  // Restoranın tüm müşterileri aynı WiFi/NAT IP'sinden gelir; sadece IP'ye
  // bakan sınır bir masanın diğerlerini kilitlemesine yol açıyordu. Asıl sınır
  // masa başına, IP sınırı ise yalnızca dışarıdan gelen kaba saldırılar için geniş.
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

  const body = await req.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const quantity = Number(body?.quantity ?? 1);

  if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return NextResponse.json({ error: "Geçersiz sipariş" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, branchId: table.branchId },
  });
  if (!product || !product.isAvailable) {
    return NextResponse.json(
      { error: "Ürün bulunamadı veya tükendi" },
      { status: 400 }
    );
  }

  const order = await getOrCreateOpenOrder(table.id);

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      quantity,
      unitPriceCents: product.priceCents,
    },
  });

  return NextResponse.json({ ok: true });
}
