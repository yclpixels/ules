import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePendingPayment } from "@/lib/orders";
import { retrieveCheckoutFormResult } from "@/lib/payments/iyzico";
import { getBaseUrl } from "@/lib/baseUrl";

/**
 * iyzico, müşteri ödeme formunu tamamladıktan sonra kullanıcının tarayıcısını
 * buraya (form POST ile) yönlendirir. Burada sonucu iyzico'dan tekrar
 * sorgulayıp (retrieve) doğruluyoruz — callback body'sine güvenmiyoruz,
 * çünkü o taklit edilebilir; asıl doğrulama iyzico'nun sunucusuna sorarak yapılır.
 */
export async function POST(req: Request) {
  const baseUrl = await getBaseUrl();
  const formData = await req.formData().catch(() => null);
  const token = formData?.get("token")?.toString();

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/admin`, { status: 303 });
  }

  let result: Record<string, unknown>;
  try {
    result = await retrieveCheckoutFormResult(token);
  } catch (err) {
    console.error("[iyzico-callback] retrieve başarısız:", err);
    return NextResponse.redirect(`${baseUrl}/admin`, { status: 303 });
  }

  const paymentId = result.conversationId as string | undefined;
  const success =
    result.status === "success" && result.paymentStatus === "SUCCESS";

  if (!paymentId) {
    return NextResponse.redirect(`${baseUrl}/admin`, { status: 303 });
  }

  await resolvePendingPayment(paymentId, success);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { include: { table: true } } },
  });
  const qrToken = payment?.order.table.qrToken;

  const redirectUrl = qrToken
    ? `${baseUrl}/masa/${qrToken}?payment=${success ? "success" : "failed"}`
    : `${baseUrl}/admin`;

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
