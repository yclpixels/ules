export function formatTL(cents: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(cents / 100);
}

export function parseTLInputToCents(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const amount = Number.parseFloat(normalized);
  if (Number.isNaN(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
}
