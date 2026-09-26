import { prisma } from "@/lib/prisma";
import { vatBreakdown } from "@/lib/vat";

/**
 * Müşteri fişi (ekranda, yazdırmada ve e-postada aynı içerik).
 *
 * DİKKAT: Bu bir BİLGİ FİŞİDİR, mali belge değildir. Mali fiş yalnızca GİB
 * onaylı yazar kasa / ÖKC'den (EKÜ ve Z numaralı), fatura ise e-Arşiv/e-Fatura
 * üzerinden kesilir. Fişin altındaki "mali değeri yoktur" ibaresi bu yüzden
 * kaldırılmamalı.
 */
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
  const vat = vatBreakdown(order.items);

  return { order, totalCents, paidCents, tipCents, vat };
}

export type ReceiptData = NonNullable<
  Awaited<ReturnType<typeof getReceiptData>>
>;

/** Fişteki tutar biçimi: "150,00" (para birimi başlıkta değil, fişlerdeki gibi). */
export function receiptAmount(cents: number): string {
  return (cents / 100).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const CARD_LABELS: Record<string, string> = {
  MASTER_CARD: "Mastercard",
  VISA: "Visa",
  TROY: "Troy",
  AMERICAN_EXPRESS: "American Express",
};

export type ReceiptView = {
  brand: string;
  headerLines: string[];
  meta: [string, string][];
  items: { name: string; detail: string | null; vatRate: number; amount: string }[];
  vatLines: { label: string; amount: string }[];
  totalVat: string;
  total: string;
  payments: { label: string; amount: string; lines: string[] }[];
  tip: string | null;
  remaining: string | null;
  footerLines: string[];
};

/** Fişin satırları; sayfa ve e-posta yalnızca bunu çizer. */
export function buildReceiptView(data: ReceiptData): ReceiptView {
  const { order, totalCents, paidCents, tipCents, vat } = data;
  const branch = order.table.branch;
  const at = order.closedAt || order.createdAt;

  const headerLines = [
    branch.legalName && branch.legalName !== branch.name ? branch.legalName : null,
    branch.legalAddress,
    branch.taxOffice && branch.taxNumber
      ? `${branch.taxOffice} V.D. ${branch.taxNumber}`
      : null,
    branch.mersisNo ? `MERSİS: ${branch.mersisNo}` : null,
  ].filter((l): l is string => Boolean(l));

  return {
    brand: branch.name,
    headerLines,
    meta: [
      ["TARİH", dateFmt.format(at).replace(/\./g, "/")],
      ["SAAT", timeFmt.format(at)],
      ["FİŞ NO", String(order.receiptNo).padStart(4, "0")],
      ["MASA", order.table.name],
    ],
    items: order.items.map((i) => ({
      name: i.product.name,
      detail: i.quantity > 1 ? `${i.quantity} x ${receiptAmount(i.unitPriceCents)}` : null,
      vatRate: i.vatRate,
      amount: receiptAmount(i.unitPriceCents * i.quantity),
    })),
    // Tek oran varsa ayrıca dökülmez (TOPKDV yeterli), birden fazlaysa oran oran.
    vatLines:
      vat.lines.length > 1
        ? vat.lines.map((l) => ({ label: `KDV %${l.rate}`, amount: receiptAmount(l.vatCents) }))
        : [],
    totalVat: receiptAmount(vat.totalVatCents),
    total: receiptAmount(totalCents),
    payments: order.payments.map((p) => {
      const lines: string[] = [];
      if (p.method !== "CASH") {
        const brand = [p.cardFamily, p.cardAssociation && CARD_LABELS[p.cardAssociation]]
          .filter(Boolean)
          .join(" · ");
        if (brand) lines.push(brand);
        if (p.cardLast4) lines.push(`************${p.cardLast4}`);
      }
      if (p.payerName) lines.push(p.payerName);
      return {
        label: p.method === "CASH" ? "NAKİT" : "KREDİ KARTI",
        // Bahşiş hesaba dahil değil; ödeme satırı yalnızca hesap payını gösterir.
        amount: receiptAmount(p.amountCents - p.tipCents),
        lines,
      };
    }),
    tip: tipCents > 0 ? receiptAmount(tipCents) : null,
    remaining: totalCents > paidCents ? receiptAmount(totalCents - paidCents) : null,
    footerLines: [branch.contactPhone, branch.contactEmail].filter(
      (l): l is string => Boolean(l)
    ),
  };
}

/**
 * Fiş HTML'i e-posta olarak gidiyor ve müşteri girdisi (ödeyen adı) ile
 * personel girdisi (ürün/masa/şube adı) içeriyor; hepsi kaçışlanmalı.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const RECEIPT_DISCLAIMER = "BU BELGE BİLGİ FİŞİDİR — MALİ DEĞERİ YOKTUR";

export function renderReceiptHtml(
  data: ReceiptData,
  baseUrl?: string
): string {
  const v = buildReceiptView(data);
  const e = escapeHtml;
  const row = (left: string, right: string, style = "") =>
    `<tr><td style="padding:2px 0;${style}">${left}</td><td style="padding:2px 0;text-align:right;white-space:nowrap;${style}">${right}</td></tr>`;
  const hr = `<tr><td colspan="2" style="border-top:1px dashed #999;padding:0;height:8px;"></td></tr>`;

  const items = v.items
    .map(
      (i) =>
        row(
          `${e(i.name)}${i.detail ? `<br><span style="color:#666;font-size:12px;">${e(i.detail)}</span>` : ""}`,
          `<span style="color:#666;font-size:12px;">%${i.vatRate}</span>&nbsp;&nbsp;*${i.amount}`
        )
    )
    .join("");

  const payments = v.payments
    .map(
      (p) =>
        row(`<b>${p.label}</b>`, `*${p.amount}`) +
        p.lines
          .map((l) => `<tr><td colspan="2" style="padding:0 0 2px 12px;color:#444;">${e(l)}</td></tr>`)
          .join("")
    )
    .join("");

  return `
    <div style="font-family:'Courier New',Courier,monospace;max-width:340px;margin:0 auto;color:#111;background:#fff;padding:16px;font-size:14px;">
      <p style="margin:0;text-align:center;font-size:17px;font-weight:bold;">${e(v.brand)}</p>
      ${v.headerLines.map((l) => `<p style="margin:2px 0 0;text-align:center;font-size:12px;">${e(l)}</p>`).join("")}
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        ${v.meta.map(([k, val]) => row(k, e(val))).join("")}
        ${hr}
        ${items}
        ${hr}
        ${v.vatLines.map((l) => row(l.label, `*${l.amount}`)).join("")}
        ${row("<b>TOPKDV</b>", `<b>*${v.totalVat}</b>`)}
        ${row("<b>TOPLAM</b>", `<b>*${v.total}</b>`, "font-size:16px;")}
        ${payments ? hr + payments : ""}
        ${v.tip ? row("BAHŞİŞ", `*${v.tip}`, "color:#666;") : ""}
        ${v.remaining ? row("KALAN", `*${v.remaining}`) : ""}
      </table>
      ${v.footerLines.map((l) => `<p style="margin:10px 0 0;text-align:center;font-size:12px;">${e(l)}</p>`).join("")}
      <p style="margin:14px 0 0;text-align:center;">Teşekkürler</p>
      <p style="margin:14px 0 0;text-align:center;font-size:11px;color:#666;">${RECEIPT_DISCLAIMER}</p>
      ${
        baseUrl
          ? `<p style="margin:12px 0 0;text-align:center;color:#aaa;font-size:11px;font-family:Arial,sans-serif;">
               E-posta adresiniz sadece bu fişi göndermek için kullanıldı.
               <a href="${e(baseUrl)}/gizlilik?fis=${e(data.order.id)}" style="color:#aaa;">Aydınlatma metni</a>
             </p>`
          : ""
      }
    </div>
  `;
}
