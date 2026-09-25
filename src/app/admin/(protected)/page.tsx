import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrderBill } from "@/lib/orders";
import { byNaturalName, formatTL } from "@/lib/money";
import { verifyAdminSession } from "@/lib/dal";
import AutoRefresh from "@/components/AutoRefresh";
import { CheckCircleIcon, ReceiptIcon, WalletIcon } from "@/components/icons";

const BRAND_GRADIENT = "linear-gradient(135deg, #E0233A, #E0233A)";

export const dynamic = "force-dynamic";

export default async function KasaPage() {
  const session = await verifyAdminSession();

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
      const { totalCents, paidCents, remainingCents } = await getOrderBill(
        openOrder.id
      );
      return {
        table,
        hasOrder: true as const,
        totalCents,
        paidCents,
        remainingCents,
      };
    })
  );

  const totalRemaining = rows.reduce(
    (sum, r) => sum + (r.hasOrder ? r.remainingCents : 0),
    0
  );
  const totalPaidToday = rows.reduce(
    (sum, r) => sum + (r.hasOrder ? r.paidCents : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Müşteri QR'dan sipariş verdiğinde kasa ekranı kendiliğinden güncellensin */}
      <AutoRefresh />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-4 space-y-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
            style={{ background: BRAND_GRADIENT }}
          >
            <WalletIcon className="w-4.5 h-4.5" />
          </div>
          <p className="text-sm text-gray-500">Açık hesap - kalan toplam</p>
          <p
            className="text-2xl font-semibold bg-clip-text text-transparent"
            style={{ backgroundImage: BRAND_GRADIENT }}
          >
            {formatTL(totalRemaining)}
          </p>
        </div>
        <div className="bg-white border rounded-2xl p-4 space-y-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
            <CheckCircleIcon className="w-4.5 h-4.5" />
          </div>
          <p className="text-sm text-gray-500">Ödenen (açık hesaplarda)</p>
          <p className="text-2xl font-semibold">{formatTL(totalPaidToday)}</p>
        </div>
      </div>

      <div className="bg-white border rounded-2xl divide-y overflow-hidden">
        {rows.map((row) => (
          <Link
            key={row.table.id}
            href={`/admin/masalar/${row.table.id}`}
            className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  row.hasOrder
                    ? "bg-amber-50 text-amber-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <ReceiptIcon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{row.table.name}</p>
                <span
                  className={`inline-block text-xs rounded-full px-2 py-0.5 mt-0.5 ${
                    row.hasOrder
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {row.hasOrder ? "Açık hesap" : "Boş"}
                </span>
              </div>
            </div>
            {row.hasOrder && (
              <div className="text-right text-sm shrink-0">
                <p className="text-gray-500">Toplam {formatTL(row.totalCents)}</p>
                <p className="text-green-600">
                  Ödenen {formatTL(row.paidCents)}
                </p>
                <p className="font-semibold">
                  Kalan {formatTL(row.remainingCents)}
                </p>
              </div>
            )}
          </Link>
        ))}
        {rows.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500">
            Henüz masa eklenmedi.{" "}
            <Link href="/admin/masalar" className="underline">
              Masa ekle
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
