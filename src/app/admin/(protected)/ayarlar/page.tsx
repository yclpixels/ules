import { prisma } from "@/lib/prisma";
import { verifyManagerSession } from "@/lib/dal";
import { updateBranchSettingsAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await verifyManagerSession();
  const branch = await prisma.branch.findUniqueOrThrow({
    where: { id: session.branchId },
  });

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">Şube Ayarları</h1>

      <form
        action={updateBranchSettingsAction}
        className="bg-white border rounded-xl p-4 space-y-4"
      >
        <div>
          <label className="text-sm font-medium">Google yorum linki</label>
          <p className="text-xs text-gray-400 mb-1">
            Müşteri ödemeden sonra 4+ yıldız verirse bu linke yönlendirilir.
            Google Business Profile → &quot;Yorum isteyin&quot; → linki
            kopyalayın (g.page/r/... ile başlar). Boş bırakırsanız adım
            atlanır.
          </p>
          <input
            name="googleReviewUrl"
            type="url"
            defaultValue={branch.googleReviewUrl ?? ""}
            placeholder="https://g.page/r/.../review"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Bahşiş seçenekleri (%)</label>
          <p className="text-xs text-gray-400 mb-1">
            Ödeme ekranında sunulan yüzdeler, virgülle ayırın (en fazla 4).
            Boş bırakırsanız bahşiş adımı gösterilmez.
          </p>
          <input
            name="tipPresets"
            defaultValue={branch.tipPresets}
            placeholder="5,10,15"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <button className="bg-black text-white rounded-lg px-4 py-2 font-medium">
          Kaydet
        </button>
      </form>
    </div>
  );
}
