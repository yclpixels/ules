/**
 * Tanıtım sitesindeki herkese açık formların (işletme başvurusu, iletişim)
 * doğrulaması. Sunucu tarafında çalışır; hatalar alan bazında döner ki form
 * ilgili alanın altında gösterebilsin.
 */
import { parseContact } from "@/lib/contact";

export const BUSINESS_TYPES = ["Restoran", "Kafe", "Fırın", "Pastane", "Bar / Pub", "Otel", "Diğer"] as const;

export const CONTACT_TOPICS = [
  "Genel soru",
  "Ürün ve demo",
  "Mevcut işletme desteği",
  "Ödeme / fiş sorunu",
  "Basın ve iş birliği",
] as const;

type FieldErrors<K extends string> = Partial<Record<K, string>>;

const text = (fd: FormData, key: string, max: number) =>
  String(fd.get(key) ?? "").trim().replace(/\s+/g, " ").slice(0, max);

function optionalUrl(raw: string): string | null | undefined {
  if (!raw) return null;
  // "instagram.com/kafe" ya da "@kafe" da kabul: kullanıcıyı https yazmaya zorlama.
  if (/^@[\w.]{1,30}$/.test(raw)) return `https://instagram.com/${raw.slice(1)}`;
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    return u.hostname.includes(".") ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

export type BusinessApplication = {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  businessType: string;
  address: string;
  website: string | null;
  tables: string;
  note: string;
};
export type BusinessField = keyof BusinessApplication | "consent";

export function validateBusinessApplication(fd: FormData):
  | { ok: true; data: BusinessApplication }
  | { ok: false; errors: FieldErrors<BusinessField> } {
  const errors: FieldErrors<BusinessField> = {};
  const businessName = text(fd, "businessName", 150);
  const ownerName = text(fd, "ownerName", 100);
  const phoneRaw = text(fd, "phone", 40);
  const emailRaw = text(fd, "email", 150);
  const city = text(fd, "city", 60);
  const district = text(fd, "district", 60);
  const businessType = text(fd, "businessType", 40);
  const address = String(fd.get("address") ?? "").trim().slice(0, 400);
  const websiteRaw = text(fd, "website", 200);
  const tables = text(fd, "tables", 10);
  const note = String(fd.get("note") ?? "").trim().slice(0, 2000);

  if (!businessName) errors.businessName = "İşletme adını yazın";
  if (!ownerName) errors.ownerName = "Yetkili adını yazın";
  const phone = parseContact(phoneRaw);
  if (!phone || phone.kind !== "phone") errors.phone = "Geçerli bir telefon numarası yazın (ör. 0555 123 45 67)";
  const email = parseContact(emailRaw);
  if (!email || email.kind !== "email") errors.email = "Geçerli bir e-posta adresi yazın";
  if (!city) errors.city = "Şehir seçin ya da yazın";
  if (!district) errors.district = "İlçeyi yazın";
  if (!(BUSINESS_TYPES as readonly string[]).includes(businessType)) errors.businessType = "İşletme türünü seçin";
  if (!address) errors.address = "İşletme adresini yazın";
  const website = optionalUrl(websiteRaw);
  if (website === undefined) errors.website = "Bağlantı geçersiz görünüyor (ör. instagram.com/isletmeniz)";
  if (tables && !/^\d{1,4}$/.test(tables)) errors.tables = "Masa sayısını rakamla yazın";
  if (fd.get("consent") !== "on") errors.consent = "Devam etmek için aydınlatma metnini onaylayın";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      businessName,
      ownerName,
      phone: phone!.value,
      email: email!.value,
      city,
      district,
      businessType,
      address,
      website: website ?? null,
      tables,
      note,
    },
  };
}

export type ContactMessage = { name: string; contact: string; contactKind: "email" | "phone"; topic: string; message: string };
export type ContactField = "name" | "contact" | "topic" | "message";

export function validateContactMessage(fd: FormData):
  | { ok: true; data: ContactMessage }
  | { ok: false; errors: FieldErrors<ContactField> } {
  const errors: FieldErrors<ContactField> = {};
  const name = text(fd, "name", 100);
  const contactRaw = text(fd, "contact", 200);
  const topic = text(fd, "topic", 60);
  const message = String(fd.get("message") ?? "").trim().slice(0, 3000);

  if (!name) errors.name = "Adınızı yazın";
  const contact = parseContact(contactRaw);
  if (!contact) errors.contact = "Size dönebilmemiz için geçerli bir e-posta ya da telefon yazın";
  if (!(CONTACT_TOPICS as readonly string[]).includes(topic)) errors.topic = "Konu seçin";
  if (message.length < 10) errors.message = "Mesajınızı biraz daha açık yazın (en az 10 karakter)";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, contact: contact!.value, contactKind: contact!.kind, topic, message } };
}
