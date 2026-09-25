import { verifyAdminSession } from "@/lib/dal";
import { markItemPreparedAction } from "@/lib/actions";
import KitchenBoard from "@/components/KitchenBoard";

export const dynamic = "force-dynamic";

/** Mutfak/bar ekranı — garson da müdür de açabilir. */
export default async function MutfakPage() {
  await verifyAdminSession();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Mutfak</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bekleyen siparişler. Yeni sipariş geldiğinde sesli uyarı verir —
          ekranı açık bırakın.
        </p>
      </div>
      <KitchenBoard markPrepared={markItemPreparedAction} />
    </div>
  );
}
