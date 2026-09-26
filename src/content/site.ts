/**
 * Tanıtım sitesinin GERÇEK işletme bilgileri — tek yerden doldurulur.
 *
 * Buradaki bölümler (müşteri yorumları, vaka çalışmaları, ekip, adres/harita,
 * telefon) boş bırakıldığında sitede HİÇ görünmez. Bilerek örnek/uydurma veri
 * konmadı: sahte yorum ve vaka çalışması hem müşteriyi yanıltır hem Google'ın
 * cezalandırdığı bir şeydir (yapılandırılmış veride sahte değerlendirme
 * "manuel işlem" sebebidir). Gerçek bilgi geldikçe doldurun, commit edin,
 * yayına alın — sayfa kendiliğinden görünür hale gelir.
 */

export type Testimonial = {
  /** Müşterinin adı soyadı (yazılı izniyle). */
  name: string;
  /** Unvanı ve işletmesi: "Sahibi, Kordon Cafe (İzmir)". */
  role: string;
  quote: string;
  /** /public altına konan fotoğraf, ör. "/musteriler/ayse-yilmaz.jpg" (isteğe bağlı). */
  photo?: string;
};

export type CaseStudy = {
  /** Adres: /vaka-calismalari/<slug> */
  slug: string;
  business: string;
  city: string;
  /** Kısa başlık: "Garson başına masa sayısı %30 arttı" — ölçülmüş sonuç olmalı. */
  title: string;
  summary: string;
  /** Ölçülmüş sonuçlar: [["Ortalama hesap kapanma süresi", "12 dk → 4 dk"], ...] */
  results: [string, string][];
  /** Paragraflar: sorun, çözüm, sonuç. */
  body: string[];
  /** YYYY-AA-GG */
  publishedAt: string;
  photo?: string;
};

export type TeamMember = {
  name: string;
  role: string;
  /** /public altına konan fotoğraf, ör. "/ekip/efe.jpg" */
  photo: string;
  linkedin?: string;
};

export const siteContent = {
  /** Uluslararası biçimde, ör. "+90 555 123 45 67". Boşsa "Ara" düğmesi çıkmaz. */
  phone: "",
  /** Sadece rakam, ülke kodu dahil, ör. "905551234567". Boşsa WhatsApp düğmesi çıkmaz. */
  whatsapp: "",
  /** Açık adres. Boşsa alt bilgide adres ve harita görünmez. */
  address: {
    street: "",
    district: "",
    city: "",
    postalCode: "",
  },
  /** Google Haritalar'daki işletme bağlantısı (Google İşletme Profili). */
  mapsUrl: "",
  /** Sosyal medya profilleri (tam adres). Arama motoru "sameAs" verisine de girer. */
  social: {
    instagram: "",
    linkedin: "",
    x: "",
  },
  testimonials: [] as Testimonial[],
  caseStudies: [] as CaseStudy[],
  team: [] as TeamMember[],
};

/** Telefon bağlantısı için sadece rakam ve +. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function hasAddress() {
  const a = siteContent.address;
  return Boolean(a.street && a.city);
}

export function formattedAddress() {
  const a = siteContent.address;
  return [a.street, a.district, [a.postalCode, a.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
}
