import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyPos } from "@/lib/posWebhook";

export async function getOpenOrder(tableId: string) {
  return prisma.order.findFirst({
    where: { tableId, status: "OPEN" },
  });
}

export async function getOrCreateOpenOrder(tableId: string) {
  const existing = await getOpenOrder(tableId);
  if (existing) return existing;

  // Garson ve müşteri aynı anda ilk ürünü eklerse iki sipariş oluşmasın diye
  // `openTableKey` unique kısıtına güveniyoruz: ikinci create P2002 ile
  // düşer, o zaman kazanan siparişi okuyup döneriz.
  try {
    return await prisma.order.create({
      data: { tableId, status: "OPEN", openTableKey: tableId },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const winner = await getOpenOrder(tableId);
      if (winner) return winner;
    }
    throw err;
  }
}

export async function getOrderBill(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: {
        where: { removedAt: null },
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
      payments: { orderBy: { createdAt: "desc" } },
      table: true,
    },
  });

  const totalCents = order.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );
  const paidPayments = order.payments.filter((p) => p.status === "PAID");
  // Bahşiş hesaba mahsup edilmez: kalan tutar sadece hesap payıyla düşer.
  const paidCents = paidPayments.reduce(
    (sum, p) => sum + (p.amountCents - p.tipCents),
    0
  );
  const tipCents = paidPayments.reduce((sum, p) => sum + p.tipCents, 0);
  const remainingCents = Math.max(totalCents - paidCents, 0);

  return { order, totalCents, paidCents, tipCents, remainingCents };
}

async function closeOrderIfFullyPaid(orderId: string) {
  const { order, totalCents, remainingCents } = await getOrderBill(orderId);
  if (order.status !== "OPEN" || remainingCents > 0) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CLOSED", closedAt: new Date(), openTableKey: null },
  });

  await notifyPos({
    type: "order.closed",
    orderId,
    tableId: order.tableId,
    tableName: order.table.name,
    totalCents,
  });
}

/**
 * Personel hesabı elle kapatır: müşteri ödemeden kalktı, hesap ikram edildi,
 * masa yanlışlıkla açıldı vb. Kalan tutar tahsil edilmiş sayılmaz; sipariş
 * CANCELLED olur ve raporda ciroya girmez (alınmış ödemeler kayıtta kalır).
 */
export async function cancelOrder(orderId: string, closedBy: string) {
  const result = await prisma.order.updateMany({
    where: { id: orderId, status: "OPEN" },
    data: {
      status: "CANCELLED",
      closedAt: new Date(),
      closedBy,
      openTableKey: null,
    },
  });
  return result.count > 0;
}

/**
 * Yanlış girilen nakit/POS ödemesini iptal eder. Sadece elle kaydedilen
 * ödemeler (recordedBy dolu) iptal edilebilir; iyzico ödemeleri iade
 * sağlayıcı panelinden yapılmalı. Hesap ödemeyle kapanmışsa tekrar açılır.
 */
export async function voidPayment(paymentId: string, voidedBy: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment || payment.status !== "PAID" || !payment.recordedBy) {
    return false;
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "VOIDED", voidedAt: new Date(), voidedBy },
  });

  // İptal edilen ödemenin üstlendiği kalemler tekrar ödenebilir hale gelir.
  await releaseItems(paymentId);

  if (payment.order.status === "CLOSED") {
    const otherOpen = await getOpenOrder(payment.order.tableId);
    // Masada bu arada yeni bir hesap açıldıysa eskisini tekrar açamayız;
    // ödeme iptal edilmiş olarak kalır, hesap kapalı görünür.
    if (!otherOpen) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: "OPEN",
          closedAt: null,
          closedBy: null,
          openTableKey: payment.order.tableId,
        },
      });
    }
  }

  return true;
}

/**
 * "Kalemleri seç" ile ödeme için: seçilen kalemlerin bu siparişe ait,
 * silinmemiş ve henüz başka biri tarafından üstlenilmemiş olduğunu doğrular,
 * toplam tutarı döner.
 *
 * Tutar istemciden gelmez — sunucuda kalemlerin kendi fiyatından hesaplanır,
 * böylece istek değiştirilerek eksik ödeme yapılamaz.
 */
export async function priceSelectedItems(orderId: string, itemIds: string[]) {
  const unique = [...new Set(itemIds)];
  if (unique.length === 0) {
    throw new Error("Hiç kalem seçilmedi");
  }

  const items = await prisma.orderItem.findMany({
    where: {
      id: { in: unique },
      orderId,
      removedAt: null,
      settledPaymentId: null,
    },
  });

  if (items.length !== unique.length) {
    // Aradaki farkı açıklamaya çalışmıyoruz: kalem bu arada silinmiş de
    // olabilir, masadaki başka biri aynı anda üstlenmiş de olabilir.
    throw new Error(
      "Seçtiğiniz kalemlerden bazıları artık uygun değil, listeyi yenileyip tekrar deneyin"
    );
  }

  const cents = items.reduce(
    (sum, i) => sum + i.unitPriceCents * i.quantity,
    0
  );
  return { items, cents };
}

/** Seçilen kalemleri bir ödemeye bağlar (aynı kalemi ikinci kişi seçemesin). */
async function reserveItems(itemIds: string[], paymentId: string) {
  await prisma.orderItem.updateMany({
    where: { id: { in: itemIds }, settledPaymentId: null },
    data: { settledPaymentId: paymentId },
  });
}

/** Ödeme başarısız/iptal olduğunda kalemleri tekrar boşa çıkarır. */
async function releaseItems(paymentId: string) {
  await prisma.orderItem.updateMany({
    where: { settledPaymentId: paymentId },
    data: { settledPaymentId: null },
  });
}

function assertValidAmounts(amountCents: number, tipCents: number) {
  if (amountCents <= 0) {
    throw new Error("Ödeme tutarı sıfırdan büyük olmalı");
  }
  if (tipCents < 0 || tipCents > amountCents) {
    throw new Error("Bahşiş tutarı geçersiz");
  }
}

/** Anında ödeme (mock sağlayıcı / nakit): tutarı direkt PAID olarak kaydeder. */
export async function payTowardsOrderInstant(
  orderId: string,
  amountCents: number,
  payerName: string | undefined,
  method: "CARD" | "CASH" = "CARD",
  recordedBy?: string,
  tipCents = 0,
  settledItemIds?: string[]
) {
  assertValidAmounts(amountCents, tipCents);

  // Kalan hesaptan fazla girilen tutar kabul edilir (bahşiş olarak kalır).
  const { order } = await getOrderBill(orderId);
  if (order.status !== "OPEN") {
    throw new Error("Bu hesap kapalı, ödeme alınamaz");
  }

  const payment = await prisma.payment.create({
    data: {
      orderId,
      amountCents,
      tipCents,
      payerName: payerName?.trim() || null,
      method,
      status: "PAID",
      paidAt: new Date(),
      recordedBy: recordedBy || null,
    },
  });

  if (settledItemIds?.length) {
    await reserveItems(settledItemIds, payment.id);
  }

  await notifyPos({
    type: "payment.completed",
    orderId,
    tableId: order.tableId,
    tableName: order.table.name,
    amountCents,
    tipCents,
    payerName: payment.payerName,
    method,
  });

  await closeOrderIfFullyPaid(orderId);

  return payment;
}

/** Yönlendirmeli sağlayıcılar (iyzico vb.) için: önce PENDING kayıt açılır. */
export async function recordPendingPayment(
  orderId: string,
  amountCents: number,
  payerName: string | undefined,
  method: "CARD" | "CASH" = "CARD",
  tipCents = 0,
  settledItemIds?: string[]
) {
  assertValidAmounts(amountCents, tipCents);

  // Kalan hesaptan fazla girilen tutar kabul edilir (bahşiş olarak kalır).
  const payment = await prisma.payment.create({
    data: {
      orderId,
      amountCents,
      tipCents,
      payerName: payerName?.trim() || null,
      method,
      status: "PENDING",
    },
  });

  // Kalemler ödeme beklerken de rezerve edilir; ödeme başarısız olursa
  // resolvePendingPayment tekrar serbest bırakır.
  if (settledItemIds?.length) {
    await reserveItems(settledItemIds, payment.id);
  }

  return payment;
}

/** iyzico callback'i doğrulandıktan sonra PENDING ödemeyi sonuçlandırır. */
export async function resolvePendingPayment(
  paymentId: string,
  success: boolean
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { include: { table: true } } },
  });
  if (!payment || payment.status !== "PENDING") return payment;

  if (!success) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "FAILED" },
    });
    await releaseItems(paymentId);
    return payment;
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "PAID", paidAt: new Date() },
  });

  await notifyPos({
    type: "payment.completed",
    orderId: payment.orderId,
    tableId: payment.order.tableId,
    tableName: payment.order.table.name,
    amountCents: payment.amountCents,
    tipCents: payment.tipCents,
    payerName: payment.payerName,
    method: payment.method,
  });

  await closeOrderIfFullyPaid(payment.orderId);

  return updated;
}
