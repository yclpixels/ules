import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOpenOrder, getOrderBill } from "@/lib/orders";

function toMenuProduct(p: {
  id: string;
  name: string;
  priceCents: number;
  description: string | null;
  allergens: string | null;
  imageUrl: string | null;
}) {
  return {
    id: p.id,
    name: p.name,
    priceCents: p.priceCents,
    description: p.description,
    allergens: p.allergens,
    imageUrl: p.imageUrl,
  };
}

async function getMenu(branchId: string) {
  const categories = await prisma.category.findMany({
    where: { branchId },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { name: "asc" },
      },
    },
  });

  const uncategorized = await prisma.product.findMany({
    where: { isAvailable: true, categoryId: null, branchId },
    orderBy: { name: "asc" },
  });

  const groups = categories
    .filter((c) => c.products.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      products: c.products.map(toMenuProduct),
    }));

  if (uncategorized.length > 0) {
    groups.push({
      id: "uncategorized",
      name: "Diğer",
      products: uncategorized.map(toMenuProduct),
    });
  }

  return groups;
}

type BranchInfo = { tipPresets: number[]; googleReviewUrl: string | null };

function parseTipPresets(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 100);
}

async function buildBillResponse(
  table: { id: string; name: string },
  orderId: string,
  menu: Awaited<ReturnType<typeof getMenu>>,
  branch: BranchInfo
) {
  const { totalCents, paidCents, tipCents, remainingCents } =
    await getOrderBill(orderId);

  const items = await prisma.orderItem.findMany({
    where: { orderId, removedAt: null },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  const payments = await prisma.payment.findMany({
    where: { orderId, status: "PAID" },
    orderBy: { createdAt: "desc" },
  });

  return {
    table,
    orderId,
    items: items.map((i) => ({
      id: i.id,
      name: i.product.name,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      note: i.note,
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

export async function GET(
  _req: Request,
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

  const menu = await getMenu(table.branchId);
  const branch: BranchInfo = {
    tipPresets: parseTipPresets(table.branch.tipPresets),
    googleReviewUrl: table.branch.googleReviewUrl,
  };
  const tableInfo = { id: table.id, name: table.name };
  const order = await getOpenOrder(table.id);

  if (order) {
    return NextResponse.json(
      await buildBillResponse(tableInfo, order.id, menu, branch)
    );
  }

  // Açık sipariş yok — hesap yeni kapandıysa fiş linkine erişebilsin diye
  // en son kapanan siparişi göster (yeni sipariş başlayana kadar).
  const lastClosed = await prisma.order.findFirst({
    where: { tableId: table.id, status: "CLOSED" },
    orderBy: { closedAt: "desc" },
  });
  if (lastClosed) {
    return NextResponse.json(
      await buildBillResponse(tableInfo, lastClosed.id, menu, branch)
    );
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
