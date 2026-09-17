import { NextResponse } from "next/server";
import { getReceiptData, renderReceiptHtml } from "@/lib/receipt";
import { sendEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
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

  const html = renderReceiptHtml(data);
  const result = await sendEmail({
    to: email,
    subject: `${data.order.table.branch.name} — Fiş`,
    html,
  });

  return NextResponse.json({ ok: true, mocked: result.mocked });
}
