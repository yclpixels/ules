import { prisma } from "@/lib/prisma";

export const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

export async function resetDb() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE "OrderItem", "Payment", "Feedback", "Order", "ProductTranslation",
      "Product", "CategoryTranslation", "Category", "Table", "StaffUser",
      "DayClose", "AuditLog", "Branch" CASCADE
  `);
}

/** Bir şube + masa + ürün + açık hesap ve verilen fiyatlarda kalemler. */
export async function seedOrder(itemPrices: number[]) {
  const branch = await prisma.branch.create({ data: { name: "Test Şube" } });
  const table = await prisma.table.create({ data: { name: "Masa 1", branchId: branch.id } });
  const product = await prisma.product.create({
    data: { name: "Köfte", priceCents: 100, branchId: branch.id },
  });
  const order = await prisma.order.create({
    data: { tableId: table.id, status: "OPEN", openTableKey: table.id },
  });
  const items = [];
  for (const price of itemPrices) {
    items.push(
      await prisma.orderItem.create({
        data: { orderId: order.id, productId: product.id, unitPriceCents: price },
      })
    );
  }
  return { branch, table, product, order, items };
}

/** PENDING bir kartlı ödemeyi `minutesAgo` dakika önce açılmış gibi oluşturur. */
export async function pendingPayment(
  orderId: string,
  amountCents: number,
  opts: { minutesAgo: number; providerRef?: string | null; itemIds?: string[] }
) {
  const payment = await prisma.payment.create({
    data: {
      orderId,
      amountCents,
      method: "CARD",
      status: "PENDING",
      providerRef: opts.providerRef ?? null,
      createdAt: new Date(Date.now() - opts.minutesAgo * 60_000),
    },
  });
  if (opts.itemIds?.length) {
    await prisma.orderItem.updateMany({
      where: { id: { in: opts.itemIds } },
      data: { settledPaymentId: payment.id },
    });
  }
  return payment;
}
