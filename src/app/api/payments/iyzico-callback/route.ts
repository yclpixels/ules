import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePendingPayment } from "@/lib/orders";
import {
  isVerifiedCheckoutResult,
  retrieveCheckoutFormResult,
} from "@/lib/payments/iyzico";
import { getBaseUrl } from "@/lib/baseUrl";

/**
 * iyzico, müşteri ödeme formunu tamamladıktan sonra kullanıcının tarayıcısını
 * buraya (form POST ile) yönlendirir. Burada sonucu iyzico'dan tekrar
 * sorgulayıp (retrieve) doğruluyoruz — callback body'sine güvenmiyoruz,
 * çünkü o taklit edilebilir; asıl doğrulama iyzico'nun sunucusuna sorarak yapılır.
 *
 * Müşteri bu yönlendirmeye hiç gelmezse (tarayıcıyı kapattı, bağlantı koptu)
 * ödeme PENDING kalır; onu settleStalePendingPayments sonradan sonuçlandırır.
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

  // Sonuçta conversationId yoksa (bazı hata yanıtları) kaydı token'dan buluruz.
  const conversationId =
    typeof result.conversationId === "string" ? result.conversationId : null;
  const pending = conversationId
    ? await prisma.payment.findUnique({ where: { id: conversationId } })
    : await prisma.payment.findFirst({ where: { providerRef: token } });

  if (!pending) {
    return NextResponse.redirect(`${baseUrl}/admin`, { status: 303 });
  }

  const verified = isVerifiedCheckoutResult(result, token, pending);
  await resolvePendingPayment(pending.id, verified);

  const payment = await prisma.payment.findUnique({
    where: { id: pending.id },
    include: { order: { include: { table: true } } },
  });
  const qrToken = payment?.order.table.qrToken;
  // Aynı callback iki kez gelirse (yenileme) ikincisi kaydı değiştirmez;
  // müşteriye kaydın gerçek son durumu gösterilir.
  const succeeded = payment?.status === "PAID";

  const redirectUrl = qrToken
    ? `${baseUrl}/masa/${qrToken}?payment=${succeeded ? "success" : "failed"}`
    : `${baseUrl}/admin`;

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
