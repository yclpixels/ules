import { NextResponse } from "next/server";
import { getReceiptData, renderReceiptHtml } from "@/lib/receipt";
import { sendEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getBaseUrl } from "@/lib/baseUrl";
import { audit } from "@/lib/audit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  // Açık spam kapısı olmasın: IP başına saatte 10, sipariş başına 3 gönderim.
  const ip = clientIp(req);
  const perIp = rateLimit(`email:ip:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  const perOrder = rateLimit(`email:order:${orderId}`, { limit: 3, windowMs: 24 * 60 * 60 * 1000 });
  if (!perIp.ok || !perOrder.ok) {
    return NextResponse.json(
      { error: "Çok fazla gönderim denemesi, daha sonra tekrar deneyin" },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Geçerli bir e-posta adresi girin" },
      { status: 400 }
    );
  }

  const data = await getReceiptData(orderId);
  if (!data) {
    return NextResponse.json({ error: "Fiş bulunamadı" }, { status: 404 });
  }

  const html = renderReceiptHtml(data, await getBaseUrl());
  const result = await sendEmail({
    to: email,
    subject: `${data.order.table.branch.name} — Fiş`,
    html,
  });

  // KVKK erişim kaydı: kişisel veri (e-posta) hangi siparişe, ne zaman gitti.
  // E-posta adresinin tamamı loglanmaz — maskelenir.
  const [local, domain] = email.split("@");
  await audit({
    branchId: data.order.table.branchId,
    action: "RECEIPT_EMAILED",
    actorName: "Müşteri",
    detail: `${local.slice(0, 2)}***@${domain} — hesap no ${orderId}`,
    ip,
  });

  return NextResponse.json({ ok: true, mocked: result.mocked });
}
