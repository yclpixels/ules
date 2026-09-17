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
 * bozmaz, sadece konsola loglar.
 */
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

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (err) {
    console.error("[pos-webhook] gönderilemedi:", err);
  }
}
