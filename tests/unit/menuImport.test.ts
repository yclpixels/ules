import { describe, expect, it } from "vitest";
import { IMPORT_TEMPLATE, parseMenuImport, parsePriceToCents } from "@/lib/menuImport";

describe("parsePriceToCents", () => {
  it.each([
    ["45", 4500],
    ["45,50", 4550],
    ["45.50", 4550],
    ["1.250,50", 125050],
    ["1.250", 125000],
    ["₺ 320,00", 32000],
    ["320 TL", 32000],
  ])("%s → %i", (raw, cents) => expect(parsePriceToCents(raw)).toBe(cents));

  it.each(["", "abc", "0", "-5", "12,345"])("%s geçersiz", (raw) =>
    expect(parsePriceToCents(raw)).toBeNull()
  );
});

describe("parseMenuImport", () => {
  it("Excel'den yapıştırılan (sekmeli) başlıksız satırlar", () => {
    const { rows, errors } = parseMenuImport("Adana Kebap\t320\tAna Yemekler\t10\nAyran\t45\tİçecekler");
    expect(errors).toEqual([]);
    expect(rows.map((r) => [r.name, r.priceCents, r.category, r.vatRate])).toEqual([
      ["Adana Kebap", 32000, "Ana Yemekler", 10],
      ["Ayran", 4500, "İçecekler", null],
    ]);
  });

  it("şablon CSV'si: başlık adından eşler, ; ile böler", () => {
    const { rows, errors } = parseMenuImport(IMPORT_TEMPLATE);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ name: "Adana Kebap", priceCents: 32000, description: "Acılı, lavaş ve közle", allergens: "gluten" });
    expect(rows[2]).toMatchObject({ name: "Bira 50 cl", vatRate: 20 });
  });

  it("sütun sırası başlığa göre serbest; tırnaklı hücre", () => {
    const { rows } = parseMenuImport('Fiyat,Ürün Adı,Görsel\n"1.250,00","Karışık ""Özel"" Tabak",https://ornek.com/a.jpg');
    expect(rows[0]).toMatchObject({ name: 'Karışık "Özel" Tabak', priceCents: 125000, imageUrl: "https://ornek.com/a.jpg" });
  });

  it("hatalı satırları atlar ve satır numarasıyla bildirir", () => {
    const { rows, errors } = parseMenuImport(
      "Ad\tFiyat\tKategori\tKDV\tAçıklama\tAlerjen\tFotoğraf\n" +
        "Çay\t20\n" +
        "\t30\n" +
        "Kahve\tbedava\n" +
        "Su\t10\t\t18\n" +
        "Soda\t15\t\t\t\t\tjavascript:alert(1)\n" +
        "çay\t25\n"
    );
    expect(rows.map((r) => r.name)).toEqual(["Çay"]);
    expect(errors.map((e) => e.line)).toEqual([3, 4, 5, 6, 7]);
  });
});
