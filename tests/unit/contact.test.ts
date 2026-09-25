import { describe, expect, it } from "vitest";
import { parseContact } from "@/lib/contact";

describe("parseContact", () => {
  it.each([
    ["ulesapptr@gmail.com", { kind: "email", value: "ulesapptr@gmail.com" }],
    ["  Musteri@Example.COM ", { kind: "email", value: "musteri@example.com" }],
    ["0555 123 45 67", { kind: "phone", value: "+90 555 123 45 67" }],
    ["05551234567", { kind: "phone", value: "+90 555 123 45 67" }],
    ["5551234567", { kind: "phone", value: "+90 555 123 45 67" }],
    ["+90 (555) 123-45-67", { kind: "phone", value: "+90 555 123 45 67" }],
    ["905551234567", { kind: "phone", value: "+90 555 123 45 67" }],
    ["0212 555 12 34", { kind: "phone", value: "+90 212 555 12 34" }],
    ["+49 30 1234567", { kind: "phone", value: "+49301234567" }],
  ])("kabul eder: %s", (input, expected) => {
    expect(parseContact(input)).toEqual(expected);
  });

  it.each([
    "deneme", // canlıdaki ilk talepte yazılan
    "",
    "   ",
    "efe@",
    "efe@gmail",
    "0555 123", // eksik hane
    "0655 123 45 67", // Türkiye'de 6 ile başlayan numara yok
    "0555 123 45 678", // fazla hane
    "tel: 0555 123 45 67", // harf var
    "+1 23", // çok kısa yurt dışı
  ])("reddeder: %s", (input) => {
    expect(parseContact(input)).toBeNull();
  });
});
