/**
 * KDV: menü fiyatları KDV DAHİLDİR. Fişteki "TOPKDV" bu fiyatların içindeki
 * vergidir: brüt × oran / (100 + oran). Yuvarlama oran başına bir kez yapılır
 * (kalem kalem yuvarlayıp toplamak kuruş kaydırır).
 */

/** Panelde seçilebilen oranlar. Restoran yiyecek/alkolsüz içecek %10, alkollü içecek %20. */
export const VAT_RATES = [0, 1, 10, 20] as const;

export function parseVatRate(value: unknown): number | null {
  const n = Number(value);
  return (VAT_RATES as readonly number[]).includes(n) ? n : null;
}

export type VatLine = { rate: number; grossCents: number; vatCents: number };

export function vatBreakdown(
  items: { unitPriceCents: number; quantity: number; vatRate: number }[]
): { lines: VatLine[]; totalVatCents: number } {
  const grossByRate = new Map<number, number>();
  for (const i of items) {
    grossByRate.set(i.vatRate, (grossByRate.get(i.vatRate) ?? 0) + i.unitPriceCents * i.quantity);
  }
  const lines = [...grossByRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, grossCents]) => ({
      rate,
      grossCents,
      vatCents: Math.round((grossCents * rate) / (100 + rate)),
    }));
  return { lines, totalVatCents: lines.reduce((s, l) => s + l.vatCents, 0) };
}
