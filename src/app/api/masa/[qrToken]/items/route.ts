import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateOpenOrder } from "@/lib/orders";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  const { qrToken } = await params;
  const table = await prisma.table.findUnique({ where: { qrToken } });
  if (!table) {
    return NextResponse.json({ error: "Masa bulunamadı" }, { status: 404 });
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
