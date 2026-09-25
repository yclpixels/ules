import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyPos } from "@/lib/posWebhook";
import {
  isVerifiedCheckoutResult,
  retrieveCheckoutFormResult,
} from "@/lib/payments/iyzico";

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

/**
 * Ödemeyi oluşturur ve seçilen kalemleri aynı transaction içinde bu ödemeye
 * bağlar. Kalemler `FOR UPDATE` ile kilitlenir: masadaki iki kişi aynı kalemi
 * aynı anda seçerse ikincisi kilidi bekler, kalemi dolu bulur ve ödemesi
 * hiç oluşmadan geri alınır (aynı kalem iki kez tahsil edilmez).
 */
async function createPaymentReservingItems(
  data: Prisma.PaymentUncheckedCreateInput,
  settledItemIds?: string[]
) {
  const itemIds = [...new Set(settledItemIds ?? [])];
  return prisma.$transaction(async (tx) => {
    if (itemIds.length > 0) {
      await tx.$queryRaw`SELECT "id" FROM "OrderItem" WHERE "id" IN (${Prisma.join(itemIds)}) FOR UPDATE`;
    }
    const payment = await tx.payment.create({ data });
    if (itemIds.length > 0) {
      const reserved = await tx.orderItem.updateMany({
        where: {
          id: { in: itemIds },
          orderId: data.orderId,
          removedAt: null,
          settledPaymentId: null,
        },
        data: { settledPaymentId: payment.id },
      });
      if (reserved.count !== itemIds.length) {
        throw new Error(
          "Seçtiğiniz kalemlerden bazıları artık uygun değil, listeyi yenileyip tekrar deneyin"
        );
      }
    }
    return payment;
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

  const payment = await createPaymentReservingItems(
    {
      orderId,
      amountCents,
      tipCents,
      payerName: payerName?.trim() || null,
      method,
      status: "PAID",
      paidAt: new Date(),
      recordedBy: recordedBy || null,
    },
    settledItemIds
  );

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
  // Kalemler ödeme beklerken de rezerve edilir; ödeme başarısız olursa
  // resolvePendingPayment tekrar serbest bırakır.
  return createPaymentReservingItems(
    {
      orderId,
      amountCents,
      tipCents,
      payerName: payerName?.trim() || null,
      method,
      status: "PENDING",
    },
    settledItemIds
  );
}

/**
 * iyzico callback'i doğrulandıktan sonra PENDING ödemeyi sonuçlandırır.
 * Durum geçişi koşullu (`status: PENDING`) yapılır: callback iki kez gelirse
 * ya da callback ile askıdaki ödeme temizliği aynı anda çalışırsa yalnızca
 * biri kazanır — ödeme iki kez işlenmez, POS'a çift bildirim gitmez.
 */
export async function resolvePendingPayment(
  paymentId: string,
  success: boolean
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { include: { table: true } } },
  });
  if (!payment || payment.status !== "PENDING") return payment;

  const claimed = await prisma.payment.updateMany({
    where: { id: paymentId, status: "PENDING" },
    data: success
      ? { status: "PAID", paidAt: new Date() }
      : { status: "FAILED" },
  });
  if (claimed.count === 0) return payment;

  if (!success) {
    await releaseItems(paymentId);
    return payment;
  }

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

  return payment;
}

/**
 * iyzico ödeme formu token'ı 30 dakika geçerli; bu süreden sonra müşteri o
 * formla ödeme yapamaz. Biraz pay bırakıyoruz ki formu doldurmakta olan
 * müşterinin ödemesi yanlışlıkla başarısız sayılmasın.
 */
const PENDING_PAYMENT_TTL_MS = 35 * 60 * 1000;

/**
 * Askıda kalmış kartlı ödemeleri sonuçlandırır. Müşteri iyzico formundayken
 * tarayıcıyı kapatırsa callback hiç gelmez; ödeme PENDING, seçtiği kalemler
 * de "başkası üstlendi" olarak kilitli kalırdı.
 *
 * Körlemesine FAILED yapılmaz: müşteri gerçekten ödeyip callback'e hiç
 * dönmemiş olabilir. Önce iyzico'ya sorulur — para alınmışsa PAID, alınmamışsa
 * FAILED olur ve kalemler serbest kalır. iyzico'ya ulaşılamazsa kayda
 * dokunulmaz, bir sonraki çağrıda tekrar denenir.
 *
 * Ayrı bir zamanlayıcı yok: müşteri ekranı, ödeme isteği ve kasa ekranı
 * açıldıkça çağrılır. iyzico'ya yalnızca süresi geçmiş kayıtlar için gidilir.
 */
export async function settleStalePendingPayments(
  scope: { orderId: string } | { branchId: string }
) {
  const stale = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(Date.now() - PENDING_PAYMENT_TTL_MS) },
      ...("orderId" in scope
        ? { orderId: scope.orderId }
        : { order: { table: { branchId: scope.branchId } } }),
    },
  });

  for (const payment of stale) {
    // Token hiç kaydedilmediyse müşteriye ödeme formu gösterilmedi (form,
    // token kaydedildikten sonra döndürülüyor) — tahsilat olmuş olamaz.
    if (!payment.providerRef) {
      await resolvePendingPayment(payment.id, false);
      continue;
    }
    try {
      const result = await retrieveCheckoutFormResult(payment.providerRef);
      await resolvePendingPayment(
        payment.id,
        isVerifiedCheckoutResult(result, payment.providerRef, payment)
      );
    } catch (err) {
      console.error("[payments] askıdaki ödeme doğrulanamadı, sonra tekrar denenecek", {
        paymentId: payment.id,
        err,
      });
    }
  }
}
