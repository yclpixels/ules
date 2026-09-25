import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTL } from "@/lib/money";
import { verifyManagerSession } from "@/lib/dal";
import { addDays, startOfDayInIstanbul, toDateInputValue } from "@/lib/dates";

export const dynamic = "force-dynamic";

const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function SiparislerPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await verifyManagerSession();

  const { date: dateParam } = await searchParams;
  // Sunucu UTC'de çalışsa bile "gün" Türkiye saatine göre hesaplanır.
  const today = startOfDayInIstanbul(new Date())!;

  let selectedDate = today;
  if (dateParam) {
    const parsed = startOfDayInIstanbul(dateParam);
    if (parsed) selectedDate = parsed;
  }
  const nextDate = addDays(selectedDate, 1);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: selectedDate, lt: nextDate },
      table: { branchId: session.branchId },
    },
    include: {
      table: true,
      items: { include: { product: true }, orderBy: { createdAt: "asc" } },
      payments: { where: { status: "PAID" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = orders.map((order) => {
    const totalCents = order.items
      .filter((item) => !item.removedAt)
      .reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
    // Bahşiş ciroya karışmaz: ödenen/nakit/kart tutarları hesap payıdır, bahşiş ayrı.
    const paidCents = order.payments.reduce(
      (s, p) => s + (p.amountCents - p.tipCents),
      0
    );
    const tipCents = order.payments.reduce((s, p) => s + p.tipCents, 0);
    const cashCents = order.payments
      .filter((p) => p.method === "CASH")
      .reduce((s, p) => s + (p.amountCents - p.tipCents), 0);
    const cardCents = order.payments
      .filter((p) => p.method === "CARD")
      .reduce((s, p) => s + (p.amountCents - p.tipCents), 0);
    return { order, totalCents, paidCents, tipCents, cashCents, cardCents };
  });

  // İptal edilen hesaplar ciroya girmez; alınmış ödemeler yine sayılır.
  const dayTotalCents = rows
    .filter((r) => r.order.status !== "CANCELLED")
    .reduce((s, r) => s + r.totalCents, 0);
  const dayPaidCents = rows.reduce((s, r) => s + r.paidCents, 0);
  const dayCashCents = rows.reduce((s, r) => s + r.cashCents, 0);
  const dayCardCents = rows.reduce((s, r) => s + r.cardCents, 0);
  const dayTipCents = rows.reduce((s, r) => s + r.tipCents, 0);

  const isToday = toDateInputValue(selectedDate) === toDateInputValue(today);

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-2xl p-4 flex items-center gap-3 flex-wrap">
        <Link
          href={`/admin/siparisler?date=${toDateInputValue(
            addDays(selectedDate, -1)
          )}`}
          className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50"
        >
          ← Önceki gün
        </Link>
        <form action="/admin/siparisler" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={toDateInputValue(selectedDate)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <button
            className="text-sm text-white rounded-lg px-3 py-2"
            style={{ background: "linear-gradient(135deg, #E0233A, #E0233A)" }}
          >
            Git
          </button>
        </form>
        {!isToday && (
          <Link
            href={`/admin/siparisler?date=${toDateInputValue(
              addDays(selectedDate, 1)
            )}`}
            className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50"
          >
            Sonraki gün →
          </Link>
        )}
        {!isToday && (
          <Link
            href="/admin/siparisler"
            className="text-sm underline text-gray-500"
          >
            Bugüne dön
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Sipariş sayısı</p>
          <p className="text-2xl font-semibold">{rows.length}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Toplam ciro</p>
          <p className="text-2xl font-semibold">{formatTL(dayTotalCents)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Ödenen</p>
          <p className="text-2xl font-semibold">{formatTL(dayPaidCents)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Nakit</p>
          <p className="text-2xl font-semibold">{formatTL(dayCashCents)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Kart</p>
          <p className="text-2xl font-semibold">{formatTL(dayCardCents)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Bahşiş</p>
          <p className="text-2xl font-semibold">{formatTL(dayTipCents)}</p>
        </div>
      </div>

      <div className="bg-white border rounded-2xl divide-y overflow-hidden">
        {rows.map(({ order, totalCents, paidCents }) => (
          <details key={order.id} className="group">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none">
              <div>
                <p className="font-medium">
                  {order.table.name}{" "}
                  <span
                    className={`text-xs font-normal px-2 py-0.5 rounded-full ${
                      order.status === "OPEN"
                        ? "bg-amber-100 text-amber-700"
                        : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {order.status === "OPEN"
                      ? "Açık"
                      : order.status === "CANCELLED"
                        ? "İptal"
                        : "Kapandı"}
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  {timeFormatter.format(order.createdAt)}
                  {order.closedAt &&
                    ` — ${timeFormatter.format(order.closedAt)}`}
                  {order.closedBy && ` · ${order.closedBy} kapattı`}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{formatTL(totalCents)}</p>
                <p className="text-gray-500">Ödenen {formatTL(paidCents)}</p>
              </div>
            </summary>
            <div className="px-4 pb-4 space-y-2">
              <div className="border-t pt-3 space-y-1">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex justify-between text-sm ${
                      item.removedAt
                        ? "text-gray-400 line-through"
                        : "text-gray-600"
                    }`}
                  >
                    <span>
                      {item.product.name} x{item.quantity} ·{" "}
                      {item.addedBy || "Müşteri"}
                      {item.removedAt && ` · ${item.removedBy} sildi`}
                      {item.note && ` · Not: ${item.note}`}
                    </span>
                    <span>
                      {formatTL(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              {order.payments.length > 0 && (
                <div className="border-t pt-3 space-y-1">
                  {order.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between text-sm text-gray-600"
                    >
                      <span>
                        {p.payerName || "İsimsiz"} ·{" "}
                        {p.method === "CASH" ? "Nakit" : "Kart"}
                        {p.recordedBy && ` · ${p.recordedBy} aldı`}
                        {p.tipCents > 0 &&
                          ` · ${formatTL(p.tipCents)} bahşiş dahil`}
                      </span>
                      <span>{formatTL(p.amountCents)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-3">
                <Link
                  href={`/fis/${order.id}`}
                  target="_blank"
                  className="text-sm underline text-gray-500"
                >
                  Fişi Görüntüle
                </Link>
              </div>
            </div>
          </details>
        ))}
        {rows.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500">
            Bu tarihte sipariş yok.
          </p>
        )}
      </div>
    </div>
  );
}
