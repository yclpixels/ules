import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail, supportInbox } from "@/lib/email";
import { escapeHtml } from "@/lib/receipt";
import { getBaseUrl } from "@/lib/baseUrl";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type NewSupportRequest = {
  kind: "DEMO" | "SUPPORT";
  name: string;
  contact: string;
  subject?: string | null;
  message?: string | null;
  branchId?: string | null;
  /** Destek talebinde şube adı (e-posta konusunda görünsün diye). */
  branchName?: string | null;
  /** İletişim bilgisi e-posta değilse "Yanıtla" için kullanılacak adres. */
  replyTo?: string | null;
};

/**
 * Demo/destek talebini ÖNCE veritabanına yazar, sonra bize e-posta atar.
 * Sıra bilinçli: e-posta yapılandırılmamışsa ya da gönderim başarısız olursa
 * talep yine de /admin/talepler'de görünür — eskiden form "teşekkürler"
 * deyip talebi hiçbir yere kaydetmiyordu.
 */
export async function createSupportRequest(input: NewSupportRequest) {
  const request = await prisma.supportRequest.create({
    data: {
      kind: input.kind,
      name: input.name,
      contact: input.contact,
      subject: input.subject || null,
      message: input.message || null,
      branchId: input.branchId || null,
    },
  });

  const to = supportInbox();
  if (!to) {
    console.warn("[support] SUPPORT_EMAIL tanımlı değil — talep sadece panelde görünecek", request.id);
    return request;
  }

  const replyTo = EMAIL_RE.test(input.contact) ? input.contact : input.replyTo || undefined;
  const label = input.kind === "DEMO" ? "Demo talebi" : "Destek talebi";
  const who = input.kind === "DEMO" ? input.name : `${input.branchName ?? "Şube"} — ${input.name}`;
  const subject = `${label}: ${who}${input.subject ? ` — ${input.subject}` : ""}`.replace(/[\r\n]+/g, " ");

  const rows: [string, string | null | undefined][] = [
    [input.kind === "DEMO" ? "İşletme" : "Gönderen", input.name],
    ["Şube", input.branchName],
    ["İletişim", input.contact],
    ["Konu", input.subject],
  ];
  const baseUrl = await getBaseUrl().catch(() => "");
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="margin:0 0 16px">${label}</h2>
      <table style="border-collapse:collapse">
        ${rows
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(v!)}</strong></td></tr>`
          )
          .join("")}
      </table>
      <p style="margin:16px 0 4px;color:#666">Mesaj</p>
      <p style="margin:0;white-space:pre-wrap">${input.message ? escapeHtml(input.message) : "(boş)"}</p>
      ${baseUrl ? `<p style="margin-top:24px;font-size:12px;color:#999">Tüm talepler: <a href="${escapeHtml(baseUrl)}/admin/talepler">${escapeHtml(baseUrl)}/admin/talepler</a></p>` : ""}
    </div>`;

  try {
    const result = await sendEmail({ to, subject, html, replyTo });
    if (result.sent) {
      await prisma.supportRequest.update({
        where: { id: request.id },
        data: { emailSent: true },
      });
    }
  } catch (err) {
    // Talep kayıtlı; e-posta gitmediyse panelde "e-posta gitmedi" olarak görünür.
    console.error("[support] e-posta gönderilemedi", request.id, err);
  }
  return request;
}
