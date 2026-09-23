import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import {
  getOpenOrder,
  getOrderBill,
  payTowardsOrderInstant,
  priceSelectedItems,
  recordPendingPayment,
  resolvePendingPayment,
} from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";
import { getBaseUrl } from "@/lib/baseUrl";

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
  const table = await prisma.table.findUnique({
    where: { qrToken },
    include: { branch: { select: { cardPaymentEnabled: true } } },
  });
  if (!table) {
    return NextResponse.json({ error: "Masa bulunamadı" }, { status: 404 });
  }

  // Şube kartlı ödemeye kapalıysa (varsayılan) istek buradan öteye geçmez.
  // Arayüz zaten butonu göstermiyor; bu, doğrudan API'ye atılan isteğe karşı.
  if (!table.branch.cardPaymentEnabled) {
    return NextResponse.json(
      { error: "Bu işletmede QR ile kartlı ödeme kapalı, lütfen personele ödeyin" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);

  // "Kalemleri seç" modu: tutarı istemci göndermez, sunucu kalemlerden hesaplar.
  const itemIds: string[] = Array.isArray(body?.itemIds)
    ? body.itemIds.filter((x: unknown) => typeof x === "string").slice(0, 200)
    : [];

  const amountCents = Math.round(Number(body?.amountCents));
  const payerName =
    typeof body?.payerName === "string"
      ? body.payerName.trim().slice(0, 60)
      : undefined;

  // amountCents = hesap payı + bahşiş (müşteriden çekilecek toplam)
  const tipCents = Math.round(Number(body?.tipCents ?? 0));

  if (
    !Number.isFinite(amountCents) ||
    amountCents <= 0 ||
    !Number.isFinite(tipCents) ||
    tipCents < 0 ||
    // tipCents === amountCents = hesap payı 0, sadece bahşiş bırakılıyor (geçerli)
    tipCents > amountCents
  ) {
    return NextResponse.json(
      { error: "Geçersiz ödeme tutarı" },
      { status: 400 }
    );
  }

  const order = await getOpenOrder(table.id);
  if (!order) {
    return NextResponse.json(
      { error: "Ödenecek açık hesap yok" },
      { status: 400 }
    );
  }

  // Kalem seçildiyse hesap payını kalemlerden hesapla; kalandan fazlasını
  // tahsil etme (masadaki başkası eşit bölmeyle zaten ödemiş olabilir).
  let shareCents = amountCents - tipCents;
  if (itemIds.length > 0) {
    try {
      const { cents } = await priceSelectedItems(order.id, itemIds);
      const { remainingCents } = await getOrderBill(order.id);
      shareCents = Math.min(cents, remainingCents);
      if (shareCents <= 0) {
        return NextResponse.json(
          { error: "Bu hesapta ödenecek tutar kalmadı" },
          { status: 400 }
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kalemler doğrulanamadı";
      return NextResponse.json({ error: message }, { status: 409 });
    }
  }
  const chargeCents = shareCents + tipCents;

  const provider = getPaymentProvider();

  // Prod'da yanlışlıkla mock ile çıkılırsa müşteri hesabı bedava kapatır.
  // Bilinçli demo için ALLOW_MOCK_PAYMENTS=true ile açılabilir.
  if (
    process.env.PAYMENT_PROVIDER !== "iyzico" &&
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_MOCK_PAYMENTS !== "true"
  ) {
    console.error("[pay] PAYMENT_PROVIDER=mock prod'da engellendi (ALLOW_MOCK_PAYMENTS yok)");
    return NextResponse.json(
      { error: "Kartla ödeme şu an kapalı, lütfen personele ödeyin" },
      { status: 503 }
    );
  }

  try {
    if (process.env.PAYMENT_PROVIDER !== "iyzico") {
      await payTowardsOrderInstant(
        order.id,
        chargeCents,
        payerName,
        "CARD",
        undefined,
        tipCents,
        itemIds
      );
      return NextResponse.json({ mode: "instant", ok: true });
    }

    const payment = await recordPendingPayment(
      order.id,
      chargeCents,
      payerName,
      "CARD",
      tipCents,
      itemIds
    );

    const baseUrl = await getBaseUrl();
    const buyerIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const result = await provider.startPayment({
      conversationId: payment.id,
      amountCents: chargeCents,
      payerName,
      callbackUrl: `${baseUrl}/api/payments/iyzico-callback`,
      buyerIp,
    });

    if (!result.success || result.mode !== "redirect") {
      await resolvePendingPayment(payment.id, false);
      const error = "error" in result ? result.error : "Ödeme başlatılamadı";
      return NextResponse.json({ error }, { status: 400 });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerRef: result.token },
    });

    return NextResponse.json({
      mode: "redirect",
      ok: true,
      checkoutFormContent: result.checkoutFormContent,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ödeme başarısız";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
