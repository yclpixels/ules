import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrderBill } from "@/lib/orders";
import { byNaturalName, formatTL } from "@/lib/money";
import { verifyAdminSession } from "@/lib/dal";

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
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Açık hesap - kalan toplam</p>
          <p className="text-2xl font-semibold">{formatTL(totalRemaining)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Ödenen (açık hesaplarda)</p>
          <p className="text-2xl font-semibold">{formatTL(totalPaidToday)}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl divide-y">
        {rows.map((row) => (
          <Link
            key={row.table.id}
            href={`/admin/masalar/${row.table.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">{row.table.name}</p>
              <p className="text-sm text-gray-500">
                {row.hasOrder ? "Açık hesap" : "Boş"}
              </p>
            </div>
            {row.hasOrder && (
              <div className="text-right text-sm">
                <p>Toplam {formatTL(row.totalCents)}</p>
                <p className="text-green-600">
                  Ödenen {formatTL(row.paidCents)}
                </p>
                <p className="font-medium">
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
