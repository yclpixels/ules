/**
 * Basit bellek içi hız sınırlayıcı (IP/anahtar başına pencere içinde N istek).
 * Tek sunucu için yeterli; birden fazla instance'a çıkınca Redis/Upstash ile
 * değiştirilmeli (arayüz aynı kalır).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Bellek şişmesin diye ara ara süresi dolanları temizle. */
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}, 60_000).unref?.();

/**
 * İstemci IP'si. X-Forwarded-For'un EN SOLDAKİ değeri istemcinin kendisinin
 * yazabildiği değerdir — ona güvenilirse saldırgan her istekte farklı bir
 * IP uydurup IP bazlı giriş sınırını atlatır ve denetim kaydına sahte IP
 * düşürür. Güvenilir olan, bizim önümüzdeki proxy'lerin (Railway, Vercel,
 * Cloudflare...) sağdan eklediği değerlerdir.
 *
 * TRUSTED_PROXY_HOPS: uygulamanın önündeki proxy sayısı (varsayılan 1 —
 * Railway/Render/Fly gibi tek katman). Cloudflare + Railway gibi iki katman
 * varsa 2. Uygulama doğrudan internete açıksa (proxy yok) 0 — o zaman
 * başlıklara hiç güvenilmez.
 */
export function clientIpFromHeaders(h: Headers): string {
  const hops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10);
  if (!Number.isInteger(hops) || hops <= 0) return "unknown";

  const chain = (h.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (chain.length > 0) {
    // Zincir beklenenden kısaysa en soldakini al (daha iyisi yok).
    return chain[Math.max(chain.length - hops, 0)];
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

export function clientIp(req: Request): string {
  return clientIpFromHeaders(req.headers);
}
