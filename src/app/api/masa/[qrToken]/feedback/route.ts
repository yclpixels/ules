import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { notifyIfLowRating } from "@/lib/feedbackAlerts";

const RATING_KEYS = [
  "foodRating",
  "serviceRating",
  "ambianceRating",
  "valueRating",
] as const;

function parseRating(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

/**
 * Ödeme sonrası müşteri değerlendirmesi. Kimlik yok (müşteri anonim);
 * kötüye kullanımı sınırlamak için sipariş başına en fazla 5 kayıt alınır
 * ve sadece o masanın son siparişi değerlendirilebilir.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  const { qrToken } = await params;
  // Restoranın tüm müşterileri aynı WiFi/NAT IP'sinden gelir; sadece IP'ye
  // bakan sınır bir masanın diğerlerini kilitlemesine yol açıyordu. Asıl sınır
  // masa başına, IP sınırı ise yalnızca dışarıdan gelen kaba saldırılar için geniş.
  const perTable = rateLimit(`masa:table:${qrToken}`, { limit: 40, windowMs: 60 * 1000 });
  const perIp = rateLimit(`masa:ip:${clientIp(req)}`, { limit: 600, windowMs: 60 * 1000 });
  if (!perTable.ok || !perIp.ok) {
    return NextResponse.json({ error: "Çok hızlı, biraz bekleyin" }, { status: 429 });
  }
  const table = await prisma.table.findUnique({ where: { qrToken } });
  if (!table) {
    return NextResponse.json({ error: "Masa bulunamadı" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const ratings = RATING_KEYS.map((k) => parseRating(body?.[k]));
  const comment =
    typeof body?.comment === "string"
      ? body.comment.trim().slice(0, 500) || null
      : null;

  if (!orderId || ratings.some((r) => r === null)) {
    return NextResponse.json(
      { error: "Tüm kriterler için 1–5 arası puan verin" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, tableId: table.id },
    include: { _count: { select: { feedbacks: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }
  if (order._count.feedbacks >= 5) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const [foodRating, serviceRating, ambianceRating, valueRating] =
    ratings as number[];
  const feedback = await prisma.feedback.create({
    data: {
      orderId,
      branchId: table.branchId,
      foodRating,
      serviceRating,
      ambianceRating,
      valueRating,
      comment,
    },
  });

  // Düşük puansa müdüre haber ver (panel bandı + varsa e-posta).
  // Müşteriyi bekletmemek için sonucu beklemiyoruz; kendi içinde hata yutuyor.
  void notifyIfLowRating(feedback.id);

  return NextResponse.json({ ok: true });
}
