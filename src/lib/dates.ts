/**
 * Tarih yardımcıları — tüm "gün" hesapları Europe/Istanbul'a göre yapılır
 * (Docker/Vercel sunucuları UTC çalışır; yoksa gece 00:00–03:00 arası
 * siparişler önceki güne yazılır).
 */
export const TZ = "Europe/Istanbul";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Verilen anın İstanbul'daki tarihi, "YYYY-MM-DD". */
export function toDateInputValue(d: Date): string {
  return ymdFormatter.format(d);
}

/** İstanbul'daki takvim gününün UTC başlangıcı (Date ya da "YYYY-MM-DD"). */
export function startOfDayInIstanbul(input: Date | string): Date | null {
  const ymd = typeof input === "string" ? input : toDateInputValue(input);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  // İstanbul UTC+3 sabit (2016'dan beri yaz saati yok).
  const utc = Date.UTC(y, mo - 1, d, 0, 0, 0) - 3 * 60 * 60 * 1000;
  const date = new Date(utc);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}
