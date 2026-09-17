import { prisma } from "@/lib/prisma";
import { formatTL } from "@/lib/money";

export async function getReceiptData(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: { include: { branch: true } },
      items: {
        where: { removedAt: null },
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        where: { status: "PAID" },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!order) return null;

  const totalCents = order.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );
  const paidCents = order.payments.reduce(
    (s, p) => s + (p.amountCents - p.tipCents),
    0
  );
  const tipCents = order.payments.reduce((s, p) => s + p.tipCents, 0);

  return { order, totalCents, paidCents, tipCents };
}

export type ReceiptData = NonNullable<
  Awaited<ReturnType<typeof getReceiptData>>
>;

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Fiş HTML'i e-posta olarak gidiyor ve müşteri girdisi (ödeyen adı) ile
 * personel girdisi (ürün/masa/şube adı) içeriyor; hepsi kaçışlanmalı.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderReceiptHtml(data: ReceiptData): string {
  const { order, totalCents, paidCents, tipCents } = data;
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 0;">${escapeHtml(item.product.name)} x${item.quantity}</td>
          <td style="padding:4px 0; text-align:right;">${formatTL(
            item.unitPriceCents * item.quantity
          )}</td>
        </tr>`
    )
    .join("");

  const paymentRows = order.payments
    .map(
      (p) => `
        <tr>
          <td style="padding:4px 0; color:#666;">${
            escapeHtml(p.payerName || "İsimsiz")
          } · ${p.method === "CASH" ? "Nakit" : "Kart"}</td>
          <td style="padding:4px 0; text-align:right; color:#666;">${formatTL(
            p.amountCents
          )}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif; max-width:360px; margin:0 auto; color:#111;">
      <h2 style="margin:0 0 4px;">${escapeHtml(order.table.branch.name)}</h2>
      <p style="margin:0 0 16px; color:#666;">${escapeHtml(order.table.name)} · ${dateTimeFormatter.format(
        order.closedAt || order.createdAt
      )}</p>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        ${rows}
      </table>
      <hr style="border:none; border-top:1px solid #ddd; margin:12px 0;" />
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr>
          <td style="padding:2px 0;">Toplam</td>
          <td style="padding:2px 0; text-align:right;">${formatTL(
            totalCents
          )}</td>
        </tr>
        <tr>
          <td style="padding:2px 0;">Ödenen</td>
          <td style="padding:2px 0; text-align:right;">${formatTL(
            paidCents
          )}</td>
        </tr>
        ${
          tipCents > 0
            ? `<tr><td style="padding:2px 0; color:#666;">Bahşiş</td><td style="padding:2px 0; text-align:right; color:#666;">${formatTL(tipCents)}</td></tr>`
            : ""
        }
      </table>
      ${
        order.payments.length > 0
          ? `<hr style="border:none; border-top:1px solid #ddd; margin:12px 0;" />
             <p style="margin:0 0 4px; font-size:13px; color:#666;">Ödemeler</p>
             <table style="width:100%; border-collapse:collapse; font-size:13px;">${paymentRows}</table>`
          : ""
      }
      <p style="margin:20px 0 0; text-align:center; color:#999; font-size:12px;">Bizi tercih ettiğiniz için teşekkürler!</p>
    </div>
  `;
}
