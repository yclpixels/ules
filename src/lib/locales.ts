import "server-only";

/**
 * Çok dilli menü.
 *
 * Ana dil (listenin ilki) Product/Category üzerindeki temel alanlardır —
 * çeviri tablosuna yazılmaz. Diğer diller için kayıt yoksa ana dile düşülür,
 * böylece menü hiçbir zaman boş görünmez.
 */
export const SUPPORTED_LOCALES = ["tr", "en", "de", "ru", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
  ar: "العربية",
};

/** Şubedeki dil listesini ayrıştırır; ilki ana dildir, en az bir dil döner. */
export function parseLocales(raw: string | null | undefined): string[] {
  const list = (raw || "tr")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => (SUPPORTED_LOCALES as readonly string[]).includes(s));
  const unique = [...new Set(list)];
  return unique.length > 0 ? unique : ["tr"];
}

/** İstenen dil bu şubede sunuluyor mu; değilse ana dile düşer. */
export function resolveLocale(
  requested: string | null | undefined,
  available: string[]
): string {
  const want = requested?.trim().toLowerCase();
  return want && available.includes(want) ? want : available[0];
}

type Translatable = { locale: string };

/** Bir kaydın istenen dildeki çevirisini bulur (yoksa undefined). */
export function pickTranslation<T extends Translatable>(
  translations: T[],
  locale: string
): T | undefined {
  return translations.find((t) => t.locale === locale);
}
