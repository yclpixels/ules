import { formatTL } from "@/lib/money";
import { verifyManagerSession } from "@/lib/dal";
import { getStaffPerformance } from "@/lib/reports";
import { addDays, startOfDayInIstanbul, toDateInputValue } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await verifyManagerSession();
  const { from: fromParam, to: toParam } = await searchParams;
  const today = toDateInputValue(new Date());
  const to = toParam && startOfDayInIstanbul(toParam) ? toParam : today;
  const from =
    fromParam && startOfDayInIstanbul(fromParam)
      ? fromParam
      : toDateInputValue(addDays(startOfDayInIstanbul(to)!, -6));

  const { rows, unassignedTipCents } = await getStaffPerformance(
    session.branchId,
    from,
    to
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">Personel Performansı</h1>
        <form
          action="/admin/performans"
          className="flex items-center gap-2 text-sm"
        >
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="border rounded-lg px-2 py-1"
          />
          <span>–</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="border rounded-lg px-2 py-1"
          />
          <button className="bg-black text-white rounded-lg px-3 py-1">
            Göster
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b">
            <tr>
              <th className="px-4 py-2">Personel</th>
              <th className="px-4 py-2 text-right">Eklediği kalem</th>
              <th className="px-4 py-2 text-right">Satış</th>
              <th className="px-4 py-2 text-right">Aldığı ödeme</th>
              <th className="px-4 py-2 text-right">Tahsilat</th>
              <th className="px-4 py-2 text-right">Bahşiş</th>
              <th className="px-4 py-2 text-right">Sildiği</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-right">{r.itemsAdded}</td>
                <td className="px-4 py-2 text-right">
                  {formatTL(r.salesCents)}
                </td>
                <td className="px-4 py-2 text-right">{r.paymentsRecorded}</td>
                <td className="px-4 py-2 text-right">
                  {formatTL(r.collectedCents)}
                </td>
                <td className="px-4 py-2 text-right">{formatTL(r.tipCents)}</td>
                <td
                  className={`px-4 py-2 text-right ${
                    r.removedItems > 0 ? "text-amber-600" : ""
                  }`}
                >
                  {r.removedItems}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  Bu aralıkta veri yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-500">
        Müşterilerin QR ile bıraktığı bahşiş (kimseye atanmamış, ekip havuzu):{" "}
        <strong>{formatTL(unassignedTipCents)}</strong>. Masaya garson ataması
        olmadığı için bu tutar ekip içinde paylaştırılır.
      </p>
    </div>
  );
}
