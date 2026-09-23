import "server-only";

/**
 * Herkese açık menü adresi için slug üretimi: /menu/<slug>
 * Türkçe karakterler ASCII'ye çevrilir ki adres her yerde sorunsuz paylaşılsın.
 */
const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i", İ: "i", i: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
};

export function slugify(input: string): string {
  return input
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // kalan aksanlar
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Slug geçerli mi (kullanıcı elle de girebiliyor). */
export function isValidSlug(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,59}$/.test(value) && !value.includes("--");
}
