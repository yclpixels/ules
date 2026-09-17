import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import {
  getOpenOrder,
  payTowardsOrderInstant,
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
  const rl = rateLimit(`masa:${clientIp(req)}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Çok hızlı, biraz bekleyin" }, { status: 429 });
  }
  const table = await prisma.table.findUnique({ where: { qrToken } });
  if (!table) {
    return NextResponse.json({ error: "Masa bulunamadı" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
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
    tipCents >= amountCents
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
        amountCents,
        payerName,
        "CARD",
        undefined,
        tipCents
      );
      return NextResponse.json({ mode: "instant", ok: true });
    }

    const payment = await recordPendingPayment(
      order.id,
      amountCents,
      payerName,
      "CARD",
      tipCents
    );

    const baseUrl = await getBaseUrl();
    const buyerIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const result = await provider.startPayment({
      conversationId: payment.id,
      amountCents,
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
