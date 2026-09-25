import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTL } from "@/lib/money";
import { verifyManagerSession } from "@/lib/dal";
import { getDayData } from "@/lib/reports";
import { addDays, startOfDayInIstanbul, toDateInputValue } from "@/lib/dates";
import { closeDayAction } from "@/lib/actions";

const BRAND_GRADIENT = "linear-gradient(135deg, #1D126D, #1D126D)";

export const dynamic = "force-dynamic";

const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function DayClosePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await verifyManagerSession();
  const { date: dateParam } = await searchParams;
  const today = toDateInputValue(new Date());
  const date =
    dateParam && startOfDayInIstanbul(dateParam) ? dateParam : today;

  const [day, existing, recent] = await Promise.all([
    getDayData(session.branchId, date),
    prisma.dayClose.findUnique({
      where: { branchId_date: { branchId: session.branchId, date } },
    }),
    prisma.dayClose.findMany({
      where: { branchId: session.branchId },
      orderBy: { date: "desc" },
      take: 14,
    }),
  ]);
  if (!day) return null;

  const prev = toDateInputValue(addDays(day.start, -1));
  const next = toDateInputValue(addDays(day.start, 1));
  const diff = existing
    ? existing.countedCashCents - existing.expectedCashCents
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">Gün Sonu — {date}</h1>
        <Link
          href={`/admin/gun-sonu?date=${prev}`}
          className="text-sm border rounded-lg px-3 py-1"
        >
          ← Önceki
        </Link>
        {date !== today && (
          <Link
            href={`/admin/gun-sonu?date=${next}`}
            className="text-sm border rounded-lg px-3 py-1"
          >
            Sonraki →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Nakit (kasada olmalı)</p>
          <p className="text-2xl font-semibold">{formatTL(day.cashCents)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Kart (POS cihazı)</p>
          <p className="text-2xl font-semibold">
            {formatTL(day.posCardCents)}
          </p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Kart (QR / online)</p>
          <p className="text-2xl font-semibold">{formatTL(day.onlineCents)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Bahşiş (tümünün içinde)</p>
          <p className="text-2xl font-semibold">{formatTL(day.tipCents)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-sm text-gray-500">Toplam tahsilat</p>
          <p className="text-2xl font-semibold">{formatTL(day.totalCents)}</p>
        </div>
      </div>

      <form
        action={closeDayAction}
        className={`border rounded-2xl p-4 space-y-3 ${
          existing ? "bg-green-50 border-green-200" : "bg-white"
        }`}
      >
        <input type="hidden" name="date" value={date} />
        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-44">
            <label className="text-sm text-gray-500">Sayılan nakit (TL)</label>
            <input
              name="countedCash"
              required
              defaultValue={
                existing ? (existing.countedCashCents / 100).toFixed(2) : ""
              }
              placeholder={(day.cashCents / 100).toFixed(2)}
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-gray-500">Not (opsiyonel)</label>
            <input
              name="note"
              defaultValue={existing?.note ?? ""}
              placeholder="Ör. 50 TL bozuk para çekmecede kaldı"
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
          <button
            className="text-white rounded-lg px-4 py-2 font-medium shadow-md shadow-amber-600/20"
            style={{ background: BRAND_GRADIENT }}
          >
            {existing ? "Kapanışı Güncelle" : "Günü Kapat"}
          </button>
        </div>
        {existing && diff !== null && (
          <p className="text-sm">
            {existing.closedBy} kapattı ·{" "}
            {diff === 0 ? (
              <span className="text-green-700 font-medium">
                Kasa tutuyor ✓
              </span>
            ) : (
              <span
                className={
                  diff < 0
                    ? "text-red-600 font-medium"
                    : "text-amber-600 font-medium"
                }
              >
                {diff < 0 ? "Eksik" : "Fazla"}: {formatTL(Math.abs(diff))}
              </span>
            )}
            {existing.expectedCashCents !== day.cashCents && (
              <span className="text-gray-500">
                {" "}
                (kapanıştan sonra nakit değişmiş — güncelleyin)
              </span>
            )}
          </p>
        )}
      </form>

      <div className="bg-white border rounded-2xl divide-y overflow-hidden">
        <p className="px-4 py-2 text-sm font-medium">
          Günün ödemeleri ({day.payments.length})
        </p>
        {day.payments
          .slice()
          .sort(
            (a, b) => (b.paidAt?.getTime() ?? 0) - (a.paidAt?.getTime() ?? 0)
          )
          .map((p) => (
            <div
              key={p.id}
              className="flex justify-between px-4 py-2 text-sm text-gray-600"
            >
              <span>
                {p.paidAt && timeFormatter.format(p.paidAt)} ·{" "}
                {p.order.table.name} ·{" "}
                {p.method === "CASH"
                  ? "Nakit"
                  : p.recordedBy
                    ? "Kart (POS)"
                    : "Kart (QR)"}
                {p.recordedBy && ` · ${p.recordedBy}`}
                {p.tipCents > 0 && ` · ${formatTL(p.tipCents)} bahşiş`}
              </span>
              <span>{formatTL(p.amountCents)}</span>
            </div>
          ))}
        {day.payments.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500">
            Bu gün ödeme yok.
          </p>
        )}
      </div>

      {recent.length > 0 && (
        <div className="bg-white border rounded-2xl divide-y overflow-hidden">
          <p className="px-4 py-2 text-sm font-medium">Son kapanışlar</p>
          {recent.map((c) => {
            const d = c.countedCashCents - c.expectedCashCents;
            return (
              <Link
                key={c.id}
                href={`/admin/gun-sonu?date=${c.date}`}
                className="flex justify-between px-4 py-2 text-sm hover:bg-gray-50"
              >
                <span>
                  {c.date} · {c.closedBy}
                </span>
                <span
                  className={
                    d === 0
                      ? "text-green-700"
                      : d < 0
                        ? "text-red-600"
                        : "text-amber-600"
                  }
                >
                  {d === 0
                    ? "tutuyor"
                    : `${d < 0 ? "eksik" : "fazla"} ${formatTL(Math.abs(d))}`}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
