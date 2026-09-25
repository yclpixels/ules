import { createHmac } from "crypto";

/**
 * Restoranın kullandığı POS/kasa yazılımına entegrasyon noktası.
 *
 * Her POS sistemi (Logo, Mikro, çeşitli restoran POS'ları) farklı bir API
 * bekler; bunların hepsini burada tahmin etmek yerine, ödeme/hesap kapanma
 * olaylarını basit bir webhook (POS_WEBHOOK_URL) ile dışarı bildiriyoruz.
 * O sistemin gerçek entegrasyon kodu bu URL'nin arkasında (ayrı bir
 * servis/endpoint olarak) yazılabilir — bkz. README "POS entegrasyonu".
 *
 * En iyi çaba (best-effort): webhook başarısız olsa bile ödeme akışını
 * bozmaz, sadece konsola loglar. Ödeme isteğinin içinde beklendiği için
 * süre sınırı var — yavaş bir POS sunucusu müşterinin ödeme ekranını
 * kilitlemesin.
 *
 * POS_WEBHOOK_SECRET tanımlıysa her istek imzalanır; alıcı taraf şunu
 * doğrulamalı:
 *   X-Ules-Signature == "sha256=" + HMAC_SHA256(secret, `${X-Ules-Timestamp}.${gövde}`)
 * ve zaman damgası birkaç dakikadan eskiyse isteği reddetmeli (tekrar oynatma).
 */
const WEBHOOK_TIMEOUT_MS = 3000;

type PosEvent =
  | {
      type: "payment.completed";
      orderId: string;
      tableId: string;
      tableName: string;
      amountCents: number; // tahsil edilen toplam (bahşiş dahil)
      tipCents: number;
      payerName: string | null;
      method: string;
    }
  | {
      type: "order.closed";
      orderId: string;
      tableId: string;
      tableName: string;
      totalCents: number;
    };

export async function notifyPos(event: PosEvent) {
  const url = process.env.POS_WEBHOOK_URL;
  if (!url) return;

  const body = JSON.stringify(event);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.POS_WEBHOOK_SECRET;
  if (secret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    headers["X-Ules-Timestamp"] = timestamp;
    headers["X-Ules-Signature"] =
      "sha256=" + createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[pos-webhook] ${event.type} reddedildi: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[pos-webhook] ${event.type} gönderilemedi:`, err);
  }
}
