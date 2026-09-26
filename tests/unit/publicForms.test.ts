import { describe, expect, it } from "vitest";
import { validateBusinessApplication, validateContactMessage } from "@/lib/publicForms";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

const validApp = {
  businessName: "Sahil Cafe",
  ownerName: "Ayşe Yılmaz",
  phone: "0555 123 45 67",
  email: "Ayse@Ornek.com",
  city: "İzmir",
  district: "Karşıyaka",
  businessType: "Kafe",
  address: "Atatürk Cd. No:5",
  website: "@sahilcafe",
  tables: "18",
  note: "",
  consent: "on",
};

describe("validateBusinessApplication", () => {
  it("geçerli başvuru: telefon ve e-posta normalize, @kullanıcı Instagram linkine döner", () => {
    const r = validateBusinessApplication(fd(validApp));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.phone).toBe("+90 555 123 45 67");
    expect(r.data.email).toBe("ayse@ornek.com");
    expect(r.data.website).toBe("https://instagram.com/sahilcafe");
  });

  it("web sitesi https'siz yazılabilir, boş bırakılabilir", () => {
    const a = validateBusinessApplication(fd({ ...validApp, website: "sahilcafe.com" }));
    expect(a.ok && a.data.website).toBe("https://sahilcafe.com/");
    const b = validateBusinessApplication(fd({ ...validApp, website: "" }));
    expect(b.ok && b.data.website).toBeNull();
  });

  it("hataları alan bazında döner", () => {
    const r = validateBusinessApplication(
      fd({ ...validApp, phone: "ayse@ornek.com", email: "05551234567", businessType: "Uzay istasyonu", tables: "on sekiz", website: "http://", consent: "" })
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(["businessType", "consent", "email", "phone", "tables", "website"]);
  });

  it("zorunlu alanlar boşsa", () => {
    const r = validateBusinessApplication(fd({ consent: "on" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toHaveProperty("businessName");
    expect(r.errors).toHaveProperty("address");
    expect(r.errors).not.toHaveProperty("tables"); // isteğe bağlı
  });
});

describe("validateContactMessage", () => {
  it("e-posta ya da telefon kabul eder", () => {
    const r = validateContactMessage(fd({ name: "Can", contact: "0532 000 00 00", topic: "Genel soru", message: "Merhaba, bilgi almak istiyorum." }));
    expect(r.ok && r.data.contactKind).toBe("phone");
  });

  it("kısa mesaj ve bilinmeyen konu reddedilir", () => {
    const r = validateContactMessage(fd({ name: "Can", contact: "can@ornek.com", topic: "Başka", message: "selam" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(["message", "topic"]);
  });
});
