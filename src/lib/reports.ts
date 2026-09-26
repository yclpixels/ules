import "server-only";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDayInIstanbul, toDateInputValue } from "@/lib/dates";
import { vatBreakdown } from "@/lib/vat";

/** Bir şubenin bir gününe ait tüm ödeme ve sipariş verisini tek yerden çeker. */
export async function getDayData(branchId: string, ymd: string) {
  const start = startOfDayInIstanbul(ymd);
  if (!start) return null;
  const end = addDays(start, 1);

  const [payments, items, soldItems] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: start, lt: end },
        order: { table: { branchId } },
      },
      include: { order: { include: { table: true } } },
    }),
    prisma.orderItem.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        order: { table: { branchId } },
      },
      include: { product: true },
    }),
    // KDV dökümü (Z raporundaki gibi): o gün KAPANAN hesaplardaki satışlar.
    // İptal/ikram edilen hesaplar ve silinen kalemler satışa girmez.
    prisma.orderItem.findMany({
      where: {
        removedAt: null,
        order: { status: "CLOSED", closedAt: { gte: start, lt: end }, table: { branchId } },
      },
      select: { unitPriceCents: true, quantity: true, vatRate: true },
    }),
  ]);

  const sum = (arr: { amountCents: number; tipCents: number }[]) =>
    arr.reduce((s, p) => s + p.amountCents, 0);
  const cash = payments.filter((p) => p.method === "CASH");
  // Kart: personelin POS'la aldığı (recordedBy dolu) vs müşterinin QR'dan ödediği
  const posCard = payments.filter((p) => p.method === "CARD" && p.recordedBy);
  const online = payments.filter((p) => p.method === "CARD" && !p.recordedBy);

  return {
    date: ymd,
    start,
    end,
    payments,
    items,
    cashCents: sum(cash),
    posCardCents: sum(posCard),
    onlineCents: sum(online),
    tipCents: payments.reduce((s, p) => s + p.tipCents, 0),
    totalCents: sum(payments),
    vat: vatBreakdown(soldItems),
    salesCents: soldItems.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0),
  };
}

export type StaffPerformanceRow = {
  name: string;
  itemsAdded: number;
  salesCents: number; // eklediği kalemlerin tutarı (silinenler hariç)
  paymentsRecorded: number;
  collectedCents: number; // aldığı nakit/POS ödemeleri (bahşiş hariç)
  tipCents: number; // aldığı ödemelerdeki bahşiş
  removedItems: number; // sildiği kalem sayısı (iptal/hata göstergesi)
};

/** Personel bazlı performans: ekleme, tahsilat, bahşiş, silme. */
export async function getStaffPerformance(
  branchId: string,
  fromYmd: string,
  toYmd: string
) {
  const start = startOfDayInIstanbul(fromYmd);
  const endDay = startOfDayInIstanbul(toYmd);
  if (!start || !endDay) return { rows: [] as StaffPerformanceRow[], unassignedTipCents: 0 };
  const end = addDays(endDay, 1);

  const [items, payments, staff] = await Promise.all([
    prisma.orderItem.findMany({
      where: { createdAt: { gte: start, lt: end }, order: { table: { branchId } } },
    }),
    prisma.payment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: start, lt: end },
        order: { table: { branchId } },
      },
    }),
    prisma.staffUser.findMany({ where: { branchId }, select: { name: true } }),
  ]);

  const rows = new Map<string, StaffPerformanceRow>();
  const row = (name: string) => {
    let r = rows.get(name);
    if (!r) {
      r = {
        name,
        itemsAdded: 0,
        salesCents: 0,
        paymentsRecorded: 0,
        collectedCents: 0,
        tipCents: 0,
        removedItems: 0,
      };
      rows.set(name, r);
    }
    return r;
  };
  staff.forEach((s) => row(s.name));

  for (const it of items) {
    if (it.addedBy) {
      const r = row(it.addedBy);
      r.itemsAdded += it.quantity;
      if (!it.removedAt) r.salesCents += it.unitPriceCents * it.quantity;
    }
    if (it.removedBy) row(it.removedBy).removedItems += 1;
  }

  let unassignedTipCents = 0;
  for (const p of payments) {
    if (p.recordedBy) {
      const r = row(p.recordedBy);
      r.paymentsRecorded += 1;
      r.collectedCents += p.amountCents - p.tipCents;
      r.tipCents += p.tipCents;
    } else {
      // Müşterinin QR'dan bıraktığı bahşiş kimseye atanmaz — masaya garson
      // ataması olmadığı için havuza gider (ekip paylaşımı).
      unassignedTipCents += p.tipCents;
    }
  }

  return {
    rows: [...rows.values()].sort((a, b) => b.salesCents - a.salesCents),
    unassignedTipCents,
  };
}

export { toDateInputValue };
