import { describe, expect, it } from "vitest";
import { summarizeBill } from "@/lib/orders";

describe("summarizeBill", () => {
  const items = [
    { unitPriceCents: 5000, quantity: 2 },
    { unitPriceCents: 2500, quantity: 1 },
  ];

  it("yalnızca PAID ödemeleri sayar, bahşişi hesaptan düşmez", () => {
    const bill = summarizeBill(items, [
      { status: "PAID", amountCents: 6000, tipCents: 1000 },
      { status: "PENDING", amountCents: 7500, tipCents: 0 },
      { status: "FAILED", amountCents: 7500, tipCents: 0 },
    ]);
    expect(bill).toEqual({ totalCents: 12500, paidCents: 5000, tipCents: 1000, remainingCents: 7500 });
  });

  it("fazla ödemede kalan eksiye düşmez", () => {
    const bill = summarizeBill(items, [{ status: "PAID", amountCents: 20000, tipCents: 0 }]);
    expect(bill.remainingCents).toBe(0);
  });

  it("boş hesap sıfırdır", () => {
    expect(summarizeBill([], [])).toEqual({ totalCents: 0, paidCents: 0, tipCents: 0, remainingCents: 0 });
  });
});
