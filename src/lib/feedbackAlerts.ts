import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

/**
 * Düşük puan uyarısı.
 *
 * Amaç: müşteri hâlâ masadayken müdürün haberi olsun. Kötü bir Google
 * yorumunu engellemenin tek yolu, müşteri çıkmadan müdahale etmektir.
 *
 * İki kanal var:
 *   1) Panel içi uyarı bandı (her zaman) — admin ekranı zaten 10 sn'de bir
 *      yenileniyor, ek altyapı gerektirmez.
 *   2) E-posta (Branch.alertEmail doluysa) — panel kapalıyken de ulaşır.
 *      SMTP tanımlı değilse demo modda konsola düşer, akışı bozmaz.
 */

/** 4 kriterin ortalaması bunun altındaysa "düşük puan" sayılır. */
export const LOW_RATING_THRESHOLD = 3;

export function averageRating(f: {
  foodRating: number;
  serviceRating: number;
  ambianceRating: number;
  valueRating: number;
}): number {
  return (
    (f.foodRating + f.serviceRating + f.ambianceRating + f.valueRating) / 4
  );
}

export function isLowRating(f: Parameters<typeof averageRating>[0]): boolean {
  return averageRating(f) < LOW_RATING_THRESHOLD;
}

/** Müdürün henüz "Gördüm" demediği düşük puanların sayısı. */
export async function countUnacknowledgedLowRatings(branchId: string) {
  const open = await prisma.feedback.findMany({
    where: { branchId, acknowledgedAt: null },
    select: {
      foodRating: true,
      serviceRating: true,
      ambianceRating: true,
      valueRating: true,
    },
  });
  return open.filter(isLowRating).length;
}

/**
 * Yeni bir değerlendirme geldiğinde çağrılır. Düşük değilse hiçbir şey yapmaz.
 * En iyi çaba: e-posta gönderilemezse müşteri akışı etkilenmez.
 */
export async function notifyIfLowRating(feedbackId: string) {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        branch: { select: { name: true, alertEmail: true } },
        order: { include: { table: { select: { name: true } } } },
      },
    });
    if (!feedback || !isLowRating(feedback)) return;

    const avg = averageRating(feedback).toFixed(1);
    console.warn(
      `[dusuk-puan] ${feedback.branch.name} / ${feedback.order.table.name} — ortalama ${avg}`
    );

    const to = feedback.branch.alertEmail?.trim();
    if (!to) return;

    const rows = [
      ["Yemek", feedback.foodRating],
      ["Servis", feedback.serviceRating],
      ["Ortam", feedback.ambianceRating],
      ["Fiyat", feedback.valueRating],
    ]
      .map(([label, v]) => `<tr><td>${label}</td><td>${v}/5</td></tr>`)
      .join("");

    await sendEmail({
      to,
      subject: `Düşük puan — ${feedback.order.table.name} (ortalama ${avg})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;">
          <h2 style="margin:0 0 4px;">Düşük puan bildirimi</h2>
          <p style="margin:0 0 12px;color:#666;">
            ${escapeHtml(feedback.branch.name)} · ${escapeHtml(feedback.order.table.name)}
          </p>
          <table style="border-collapse:collapse;font-size:14px;">${rows}</table>
          ${
            feedback.comment
              ? `<p style="margin:12px 0 0;"><strong>Yorum:</strong> ${escapeHtml(feedback.comment)}</p>`
              : ""
          }
          <p style="margin:16px 0 0;color:#666;font-size:13px;">
            Müşteri hâlâ masada olabilir — şimdi müdahale etmek için iyi bir an.
          </p>
        </div>`,
    });
  } catch (err) {
    console.error("[dusuk-puan] uyarı gönderilemedi:", err);
  }
}

/** Uyarı e-postası müşteri yorumunu içeriyor; kaçışlanmalı. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
