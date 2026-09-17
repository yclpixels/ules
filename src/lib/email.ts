import "server-only";
import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * SMTP_HOST tanımlı değilse "mock" modda çalışır: gerçekten göndermez,
 * sadece konsola loglar. Gerçek e-posta göndermek için .env'e SMTP_HOST,
 * SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM girin (ör. Gmail app password,
 * SendGrid, Resend SMTP vb. — hangi sağlayıcıyı kullanırsanız kullanın).
 */
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!process.env.SMTP_HOST) {
    console.log(`[email:mock] Alıcı: ${to} — Konu: ${subject}`);
    return { sent: false, mocked: true as const };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });

  return { sent: true, mocked: false as const };
}
