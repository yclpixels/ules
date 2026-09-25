/**
 * Demo/destek formlarındaki "size nasıl ulaşalım" alanı. Önceden serbest
 * metindi; canlıdaki ilk talepte iletişim olarak "deneme" yazılmıştı ve geri
 * dönmenin yolu yoktu. Artık yalnızca e-posta ya da telefon kabul edilir.
 * İstemci ve sunucu aynı kuralı kullanır (server-only değil).
 */

/**
 * Herkese açık destek adresi (sitede ve panelde görünen). Gelen kutusu
 * Natro'da yönlendirme ile Gmail'e bağlanır; uygulamanın kendi bildirimleri
 * ise SUPPORT_EMAIL'e gider (bkz. lib/email.ts).
 */
export const PUBLIC_SUPPORT_EMAIL = "destek@üleş.com";
/** mailto: bağlantılarında punycode — bazı e-posta istemcileri Türkçe alan adını açamıyor. */
export const PUBLIC_SUPPORT_MAILTO = "mailto:destek@xn--le-wka21b.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ParsedContact =
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string }
  | null;

/**
 * E-posta ya da telefon ise normalize edip döner, değilse null.
 * Telefon: Türkiye cep/sabit (05xx…, 5xx…, +90…, 0212…) ya da + ile başlayan
 * uluslararası numara; boşluk, tire, parantez serbest.
 */
export function parseContact(input: string): ParsedContact {
  const value = input.trim();
  if (!value) return null;

  if (value.includes("@")) {
    return EMAIL_RE.test(value) ? { kind: "email", value: value.toLowerCase() } : null;
  }

  if (!/^[+\d\s().-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  let national = digits;
  if (value.startsWith("+")) {
    if (!digits.startsWith("90")) {
      // Yurt dışı numara: E.164 uzunluğu yeterli.
      return digits.length >= 8 && digits.length <= 15 ? { kind: "phone", value: `+${digits}` } : null;
    }
    national = digits.slice(2);
  } else if (digits.startsWith("90") && digits.length === 12) {
    national = digits.slice(2);
  } else if (digits.startsWith("0")) {
    national = digits.slice(1);
  }
  // Türkiye: 10 hane, 2-5 ile başlar (sabit hat 2-4, cep 5).
  if (!/^[2-5]\d{9}$/.test(national)) return null;
  const n = national;
  return {
    kind: "phone",
    value: `+90 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8)}`,
  };
}

export const CONTACT_ERROR =
  "Size dönebilmemiz için geçerli bir e-posta adresi ya da telefon numarası yazın";
