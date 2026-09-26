import { describe, expect, it } from "vitest";
import { buildReceiptView, renderReceiptHtml, type ReceiptData } from "@/lib/receipt";
import { cardInfoFromResult } from "@/lib/payments/iyzico";
import { vatBreakdown } from "@/lib/vat";

function sample(): ReceiptData {
  const items = [
    { id: "i1", quantity: 1, unitPriceCents: 15000, vatRate: 10, product: { name: "Karışık Tost" } },
  ];
  const payments = [
    {
      id: "p1",
      method: "CARD",
      amountCents: 16500,
      tipCents: 1500,
      payerName: null,
      cardLast4: "9163",
      cardAssociation: "MASTER_CARD",
      cardFamily: "Maximum",
    },
  ];
  return {
    order: {
      id: "o1",
      receiptNo: 117,
      createdAt: new Date("2026-09-26T11:40:00Z"),
      closedAt: new Date("2026-09-26T11:43:55Z"),
      table: {
        name: "Masa 4",
        branch: {
          name: "Cennet Tepesi",
          legalName: "İşletme ve İştirakler Müdürlüğü",
          legalAddress: "150 Evler Mah. Kapı No:24 Ayvalık",
          mersisNo: "0126012255100016",
          taxOffice: "Ayvalık",
          taxNumber: "1260122551",
          contactPhone: null,
          contactEmail: "info@ornek.com",
        },
      },
      items,
      payments,
    },
    totalCents: 15000,
    paidCents: 15000,
    tipCents: 1500,
    vat: vatBreakdown(items),
  } as unknown as ReceiptData;
}

describe("buildReceiptView", () => {
  it("gerçek fişteki alanları üretir", () => {
    const v = buildReceiptView(sample());
    expect(v.headerLines).toContain("Ayvalık V.D. 1260122551");
    expect(v.headerLines).toContain("MERSİS: 0126012255100016");
    expect(Object.fromEntries(v.meta)).toMatchObject({
      TARİH: "26/09/2026",
      SAAT: "14:43:55",
      "FİŞ NO": "0117",
    });
    expect(v.items[0]).toMatchObject({ vatRate: 10, amount: "150,00" });
    expect(v.totalVat).toBe("13,64");
    expect(v.total).toBe("150,00");
    expect(v.payments[0]).toEqual({
      label: "KREDİ KARTI",
      amount: "150,00",
      lines: ["Maximum · Mastercard", "************9163"],
    });
    expect(v.tip).toBe("15,00");
    expect(v.remaining).toBeNull();
  });

  it("e-posta HTML'i kaçışlanır ve bilgi fişi ibaresi içerir", () => {
    const d = sample();
    (d.order.items[0].product as { name: string }).name = "<script>x</script>";
    const html = renderReceiptHtml(d);
    expect(html).not.toContain("<script>");
    expect(html).toContain("MALİ DEĞERİ YOKTUR");
  });
});

describe("cardInfoFromResult", () => {
  it("yalnızca beklenen biçimleri alır", () => {
    expect(
      cardInfoFromResult({ lastFourDigits: "9163", cardAssociation: "MASTER_CARD", cardFamily: "Maximum" })
    ).toEqual({ cardLast4: "9163", cardAssociation: "MASTER_CARD", cardFamily: "Maximum" });
    expect(
      cardInfoFromResult({ lastFourDigits: "5528790000009163", cardAssociation: "<x>", cardFamily: 5 })
    ).toEqual({ cardLast4: null, cardAssociation: null, cardFamily: null });
  });
});
