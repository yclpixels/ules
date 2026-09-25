import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrderBill, settleStalePendingPayments } from "@/lib/orders";
import { byNaturalName, formatTL } from "@/lib/money";
import { verifyAdminSession } from "@/lib/dal";
import { minutesSince } from "@/lib/dates";
import AutoRefresh from "@/components/AutoRefresh";
import { CheckCircleIcon, WalletIcon } from "@/components/icons";

const BRAND_GRADIENT = "linear-gradient(135deg, #1D126D, #1D126D)";

export const dynamic = "force-dynamic";

export default async function KasaPage() {
  const session = await verifyAdminSession();

  // Kasa ekranı 10 sn'de bir yenilendiği için askıda kalan kartlı ödemeler
  // (müşteri iyzico formunu yarıda bıraktı) burada da sonuçlandırılır.
  await settleStalePendingPayments({ branchId: session.branchId });

  const tables = await prisma.table.findMany({
    where: { branchId: session.branchId },
    orderBy: { name: "asc" },
    include: {
      orders: {
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  tables.sort(byNaturalName);

  const rows = await Promise.all(
    tables.map(async (table) => {
      const openOrder = table.orders[0];
      if (!openOrder) {
        return { table, hasOrder: false as const };
      }
      const { order, totalCents, paidCents, remainingCents } = await getOrderBill(
        openOrder.id
      );
      return {
        table,
        hasOrder: true as const,
        totalCents,
        paidCents,
        remainingCents,
        itemCount: order.items.reduce((n, i) => n + i.quantity, 0),
        // Mutfakta henüz "Hazır" denmemiş kalem: garson masaya ne zaman
        // yemek gideceğini buradan görür.
        waitingCount: order.items.filter((i) => !i.preparedAt).length,
        openMinutes: minutesSince(openOrder.createdAt),
      };
    })
  );

  const openRows = rows.filter((r) => r.hasOrder);
  const totalRemaining = rows.reduce(
    (sum, r) => sum + (r.hasOrder ? r.remainingCents : 0),
    0
  );
  const totalPaidToday = rows.reduce(
    (sum, r) => sum + (r.hasOrder ? r.paidCents : 0),
    0
  );
  const duration = (mins: number) =>
    mins < 60 ? `${mins} dk` : `${Math.floor(mins / 60)} sa ${mins % 60} dk`;

  return (
    <div className="space-y-5">
      {/* Müşteri QR'dan sipariş verdiğinde kasa ekranı kendiliğinden güncellensin */}
      <AutoRefresh />
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-xl font-semibold">Kasa</h1>
        <p className="text-sm text-gray-500">
          {openRows.length} / {rows.length} masa dolu
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border rounded-2xl p-4 space-y-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
            style={{ background: BRAND_GRADIENT }}
          >
            <WalletIcon className="w-4.5 h-4.5" />
          </div>
          <p className="text-sm text-gray-500">Açık hesaplarda kalan</p>
          <p className="text-2xl font-semibold" style={{ color: "#1D126D" }}>
            {formatTL(totalRemaining)}
          </p>
        </div>
        <div className="bg-white border rounded-2xl p-4 space-y-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
            <CheckCircleIcon className="w-4.5 h-4.5" />
          </div>
          <p className="text-sm text-gray-500">Açık hesaplarda ödenen</p>
          <p className="text-2xl font-semibold">{formatTL(totalPaidToday)}</p>
        </div>
      </div>

      {/* Masa ızgarası: sıra salondaki numara sırasıyla aynı kalır (doğal
          sıralama), personel masanın yerini ezberler. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {rows.map((row) =>
          row.hasOrder ? (
            <Link
              key={row.table.id}
              href={`/admin/masalar/${row.table.id}`}
              className="rounded-2xl p-4 min-h-[128px] flex flex-col justify-between text-white transition-transform active:scale-[0.98] shadow-sm"
              style={{ background: "#1D126D" }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-lg leading-tight">{row.table.name}</p>
                <span className="text-xs text-white/70 shrink-0 tabular-nums">
                  {duration(row.openMinutes)}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{formatTL(row.remainingCents)}</p>
                <p className="text-xs text-white/70 mt-0.5">
                  {row.itemCount} ürün
                  {row.paidCents > 0 && ` · ${formatTL(row.paidCents)} ödendi`}
                </p>
                {row.waitingCount > 0 && (
                  <span className="inline-block mt-2 text-xs font-semibold rounded-full px-2 py-0.5 bg-[#FFC857] text-[#1D126D]">
                    Mutfakta {row.waitingCount}
                  </span>
                )}
              </div>
            </Link>
          ) : (
            <Link
              key={row.table.id}
              href={`/admin/masalar/${row.table.id}`}
              className="rounded-2xl p-4 min-h-[128px] flex flex-col justify-between bg-white border border-dashed transition-colors hover:bg-gray-50 active:scale-[0.98]"
            >
              <p className="font-semibold text-lg leading-tight">{row.table.name}</p>
              <p className="text-sm text-gray-400">Boş · sipariş aç</p>
            </Link>
          )
        )}
      </div>
      {rows.length === 0 && (
        <p className="bg-white border rounded-2xl px-4 py-6 text-center text-gray-500">
          Henüz masa eklenmedi.{" "}
          <Link href="/admin/masalar" className="underline">
            Masa ekle
          </Link>
        </p>
      )}
    </div>
  );
}
