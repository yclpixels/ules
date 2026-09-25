import "server-only";
import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** "Yanıtla" denince gidecek adres (ör. destek talebinde işletmenin e-postası). */
  replyTo?: string;
};

export type SendEmailResult = { sent: boolean; mocked: boolean };

/**
 * Gönderim yolu, tanımlı ortam değişkenine göre seçilir:
 *
 * 1. RESEND_API_KEY → Resend HTTPS API. Railway Free/Trial/Hobby planlarında
 *    giden SMTP KAPALI (docs.railway.com/networking/outbound-networking);
 *    bu planlarda e-posta ancak HTTPS API'li bir servisle gider. Ek paket
 *    gerekmez, düz fetch.
 * 2. SMTP_HOST → SMTP (Railway Pro ya da başka bir barındırma).
 * 3. Hiçbiri → demo modu: göndermez, konsola yazar.
 *
 * Gönderim başarısız olursa hata fırlatır; çağıran taraf kendi akışını
 * bozmamak için yakalamalı (bkz. sendContactRequestAction).
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(input);
    return { sent: true, mocked: false };
  }
  if (process.env.SMTP_HOST) {
    await sendViaSmtp(input);
    return { sent: true, mocked: false };
  }
  console.log(`[email:mock] Alıcı: ${input.to} — Konu: ${input.subject}`);
  return { sent: false, mocked: true };
}

/** Gönderen adres. Resend'de alan adı doğrulanmış olmalı. */
function fromAddress() {
  return (
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "Üleş <bildirim@xn--le-wka21b.com>"
  );
}

async function sendViaResend({ to, subject, html, replyTo }: SendEmailInput) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    // Resend hata gövdesi { name, message } — anahtar/alan adı sorunlarını teşhis için.
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
  }
}

async function sendViaSmtp({ to, subject, html, replyTo }: SendEmailInput) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  await transporter.sendMail({ from: fromAddress(), to, subject, html, replyTo });
}

/**
 * Bizim (platformun) gelen kutusu: demo ve destek talepleri buraya düşer.
 * CONTACT_EMAIL eski ad, geriye dönük uyumluluk için okunuyor.
 */
export function supportInbox(): string | null {
  return process.env.SUPPORT_EMAIL || process.env.CONTACT_EMAIL || null;
}
