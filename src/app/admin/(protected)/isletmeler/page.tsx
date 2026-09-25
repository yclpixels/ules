import { prisma } from "@/lib/prisma";
import { verifyOwnerSession } from "@/lib/dal";
import { updateSubscriptionAction } from "@/lib/actions";
import { describeSubscription, SUBSCRIPTION_LABELS } from "@/lib/subscription";
import { formatTL } from "@/lib/money";
import { toDateInputValue } from "@/lib/dates";
import NewBranchForm from "@/components/NewBranchForm";

export const dynamic = "force-dynamic";

const TONE = {
  TRIAL: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
} as const;

/**
 * Platform sahibi paneli: tüm işletmeler, abonelik durumları, deneme süreleri.
 * Şubeye bağlı diğer sayfalar bu görünümden etkilenmez — orada sahip de
 * yalnızca kendi şubesini görür.
 */
export default async function IsletmelerPage() {
  await verifyOwnerSession();

  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { tables: true, staff: true } },
    },
  });

  const now = new Date();
  const rows = branches.map((b) => ({
    branch: b,
    view: describeSubscription(b, now),
  }));

  const activeCount = rows.filter((r) => r.view.status === "ACTIVE").length;
  const monthlyTotal = rows
    .filter((r) => r.view.status === "ACTIVE")
    .reduce((s, r) => s + (r.branch.monthlyFeeCents ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">İşletmeler</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tahsilat sistemde yapılmaz — fatura kesip EFT alırsınız. Burada
          yalnızca hangi işletmenin ne durumda olduğu tutulur.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Toplam işletme</p>
          <p className="text-2xl font-semibold">{rows.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Ödeyen</p>
          <p className="text-2xl font-semibold">{activeCount}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Aylık gelir</p>
          <p className="text-2xl font-semibold">{formatTL(monthlyTotal)}</p>
        </div>
      </div>

      <NewBranchForm />

      <div className="space-y-3">
        {rows.map(({ branch, view }) => (
          <details key={branch.id} className="bg-white border rounded-xl">
            <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-3 flex-wrap">
              <span>
                <span className="font-medium">{branch.name}</span>
                <span className="text-sm text-gray-500">
                  {" · "}
                  {branch._count.tables} masa, {branch._count.staff} personel
                  {branch.monthlyFeeCents
                    ? ` · ${formatTL(branch.monthlyFeeCents)}/ay`
                    : ""}
                </span>
              </span>
              <span
                className={`text-xs border rounded-full px-2 py-0.5 ${
                  TONE[view.status]
                }`}
              >
                {SUBSCRIPTION_LABELS[view.status]}
                {view.daysLeft !== null &&
                  (view.expired
                    ? ` · ${Math.abs(view.daysLeft)} gün geçti`
                    : ` · ${view.daysLeft} gün kaldı`)}
              </span>
            </summary>

            <form
              action={updateSubscriptionAction}
              className="border-t px-4 py-4 space-y-3"
            >
              <input type="hidden" name="branchId" value={branch.id} />
              <div className="flex gap-3 flex-wrap items-end">
                <div className="w-40">
                  <label className="text-sm text-gray-500">Durum</label>
                  <select
                    name="subscriptionStatus"
                    defaultValue={branch.subscriptionStatus}
                    className="w-full mt-1 border rounded-lg px-3 py-2"
                  >
                    <option value="TRIAL">Deneme</option>
                    <option value="ACTIVE">Abone</option>
                    <option value="SUSPENDED">Durduruldu</option>
                  </select>
                </div>
                <div className="w-44">
                  <label className="text-sm text-gray-500">
                    Deneme bitiş tarihi
                  </label>
                  <input
                    type="date"
                    name="trialEndsAt"
                    defaultValue={
                      branch.trialEndsAt
                        ? toDateInputValue(
                            new Date(branch.trialEndsAt.getTime() - 1)
                          )
                        : ""
                    }
                    className="w-full mt-1 border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="w-36">
                  <label className="text-sm text-gray-500">Aylık ücret</label>
                  <input
                    name="monthlyFee"
                    defaultValue={
                      branch.monthlyFeeCents
                        ? (branch.monthlyFeeCents / 100).toFixed(2)
                        : ""
                    }
                    placeholder="2000"
                    className="w-full mt-1 border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="w-36">
                  <label className="text-sm text-gray-500">
                    Platform komisyonu (%)
                  </label>
                  <input
                    name="platformCommissionPercent"
                    defaultValue={
                      branch.platformCommissionBp
                        ? (branch.platformCommissionBp / 100).toString()
                        : ""
                    }
                    placeholder="0"
                    className="w-full mt-1 border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              {!branch.subMerchantKey && (
                <p className="text-xs text-amber-600">
                  Bu şube henüz iyzico alt üye işyeri olarak kayıtlı değil —
                  komisyon oranı girilse bile kartlı ödeme platformun merkezi
                  hesabında kalır. Şube kendi Ayarlar sayfasından alt üye
                  kaydını tamamlamalı.
                </p>
              )}
              <div>
                <label className="text-sm text-gray-500">Not</label>
                <input
                  name="subscriptionNote"
                  defaultValue={branch.subscriptionNote ?? ""}
                  placeholder="Ör. 3 Ekim'de ödendi, 2 hafta ek süre verildi"
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                />
              </div>
              <button className="bg-black text-white rounded-lg px-4 py-2 text-sm font-medium">
                Kaydet
              </button>
            </form>
          </details>
        ))}
        {rows.length === 0 && (
          <p className="bg-white border rounded-xl px-4 py-6 text-center text-gray-500">
            Henüz işletme yok.
          </p>
        )}
      </div>
    </div>
  );
}
