import { notFound } from "next/navigation";
import Link from "next/link";
import { getReceiptData } from "@/lib/receipt";
import { formatTL } from "@/lib/money";
import EmailForm from "./EmailForm";

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const data = await getReceiptData(orderId);
  if (!data) notFound();

  const { order, totalCents, paidCents, tipCents } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white">
      <div className="max-w-sm mx-auto bg-white border rounded-xl p-6 space-y-4 print:border-none print:shadow-none">
        <div className="text-center">
          <h1 className="text-lg font-semibold">{order.table.branch.name}</h1>
          <p className="text-sm text-gray-500">
            {order.table.name} ·{" "}
            {dateTimeFormatter.format(order.closedAt || order.createdAt)}
          </p>
        </div>

        <div className="border-t pt-3 space-y-1">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product.name} x{item.quantity}
              </span>
              <span>{formatTL(item.unitPriceCents * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Toplam</span>
            <span>{formatTL(totalCents)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>Ödenen</span>
            <span>{formatTL(paidCents)}</span>
          </div>
          {tipCents > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Bahşiş</span>
              <span>{formatTL(tipCents)}</span>
            </div>
          )}
        </div>

        {order.payments.length > 0 && (
          <div className="border-t pt-3 space-y-1">
            <p className="text-xs text-gray-400">Ödemeler</p>
            {order.payments.map((p) => (
              <div
                key={p.id}
                className="flex justify-between text-sm text-gray-500"
              >
                <span>
                  {p.payerName || "İsimsiz"} ·{" "}
                  {p.method === "CASH" ? "Nakit" : "Kart"}
                </span>
                <span>{formatTL(p.amountCents)}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pt-2">
          Bizi tercih ettiğiniz için teşekkürler!
        </p>

        <div className="print:hidden space-y-3 pt-2">
          <EmailForm orderId={orderId} />
          <p className="text-xs text-gray-400 text-center">
            E-posta adresiniz sadece bu fişi göndermek için kullanılır.{" "}
            <Link href={`/gizlilik?fis=${orderId}`} className="underline">
              Gizlilik
            </Link>
          </p>
          <button
            className="w-full border rounded-lg py-2 text-sm font-medium"
            data-print-button
          >
            Yazdır
          </button>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.querySelector('[data-print-button]')?.addEventListener('click', () => window.print())`,
        }}
      />
    </div>
  );
}
