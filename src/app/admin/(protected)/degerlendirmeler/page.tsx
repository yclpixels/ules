import { prisma } from "@/lib/prisma";
import { verifyManagerSession } from "@/lib/dal";
import { acknowledgeFeedbackAction } from "@/lib/actions";
import { isLowRating } from "@/lib/feedbackAlerts";

export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "short",
  timeStyle: "short",
});

const CRITERIA = [
  { key: "foodRating", label: "Yemek" },
  { key: "serviceRating", label: "Servis" },
  { key: "ambianceRating", label: "Ortam" },
  { key: "valueRating", label: "Fiyat/Perf." },
] as const;

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-400" aria-label={`${value} yıldız`}>
      {"★".repeat(value)}
      <span className="text-gray-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default async function FeedbackPage() {
  const session = await verifyManagerSession();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [feedbacks, agg] = await Promise.all([
    prisma.feedback.findMany({
      where: { branchId: session.branchId },
      include: { order: { include: { table: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.feedback.aggregate({
      where: { branchId: session.branchId, createdAt: { gte: since } },
      _avg: {
        foodRating: true,
        serviceRating: true,
        ambianceRating: true,
        valueRating: true,
      },
      _count: true,
    }),
  ]);

  const overall =
    agg._count > 0
      ? (CRITERIA.reduce((s, c) => s + (agg._avg[c.key] ?? 0), 0) /
          CRITERIA.length
        ).toFixed(2)
      : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Müşteri Değerlendirmeleri</h1>
        <p className="text-sm text-gray-500">
          Son 30 gün: {agg._count} değerlendirme, genel ortalama {overall} / 5
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CRITERIA.map((c) => (
          <div key={c.key} className="bg-white border rounded-2xl p-4">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-semibold">
              {agg._count > 0 ? (agg._avg[c.key] ?? 0).toFixed(1) : "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-2xl divide-y overflow-hidden">
        {feedbacks.map((f) => {
          const low = isLowRating(f);
          const needsAction = low && !f.acknowledgedAt;
          return (
            <div
              key={f.id}
              className={`px-4 py-3 space-y-1 ${low ? "bg-red-50" : ""}`}
            >
              <div className="flex justify-between text-sm gap-3">
                <span className="font-medium">
                  {f.order.table.name}
                  {low && (
                    <span className="ml-2 text-xs text-red-600">
                      düşük puan
                    </span>
                  )}
                  {low && f.acknowledgedAt && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      {f.acknowledgedBy} gördü
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  {needsAction && (
                    <form action={acknowledgeFeedbackAction}>
                      <input type="hidden" name="id" value={f.id} />
                      <button className="text-xs border border-red-300 text-red-600 rounded-lg px-2 py-1 hover:bg-red-100">
                        Gördüm
                      </button>
                    </form>
                  )}
                  <span className="text-gray-500">
                    {dateTimeFormatter.format(f.createdAt)}
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                {CRITERIA.map((c) => (
                  <span key={c.key}>
                    {c.label} <Stars value={f[c.key]} />
                  </span>
                ))}
              </div>
              {f.comment && (
                <p className="text-sm text-gray-700">&ldquo;{f.comment}&rdquo;</p>
              )}
            </div>
          );
        })}
        {feedbacks.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500">
            Henüz değerlendirme yok. Müşteriler ödeme sonrası puan verdikçe
            burada görünür.
          </p>
        )}
      </div>
    </div>
  );
}
