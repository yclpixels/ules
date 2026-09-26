import { describe, expect, it } from "vitest";
import { parseVatRate, vatBreakdown } from "@/lib/vat";

describe("vatBreakdown", () => {
  it("150 TL %10 → 13,64 TL KDV (gerçek fişle aynı)", () => {
    const r = vatBreakdown([{ unitPriceCents: 15000, quantity: 1, vatRate: 10 }]);
    expect(r.totalVatCents).toBe(1364);
  });

  it("oran başına toplar, sonra yuvarlar", () => {
    const r = vatBreakdown([
      { unitPriceCents: 3333, quantity: 3, vatRate: 10 },
      { unitPriceCents: 25000, quantity: 1, vatRate: 20 },
      { unitPriceCents: 1000, quantity: 1, vatRate: 10 },
    ]);
    expect(r.lines).toEqual([
      { rate: 10, grossCents: 10999, vatCents: 1000 },
      { rate: 20, grossCents: 25000, vatCents: 4167 },
    ]);
    expect(r.totalVatCents).toBe(5167);
  });

  it("boş hesap", () => {
    expect(vatBreakdown([])).toEqual({ lines: [], totalVatCents: 0 });
  });
});

describe("parseVatRate", () => {
  it("yalnızca izinli oranlar", () => {
    expect(parseVatRate("10")).toBe(10);
    expect(parseVatRate("0")).toBe(0);
    expect(parseVatRate("18")).toBeNull();
    expect(parseVatRate("abc")).toBeNull();
  });
});
