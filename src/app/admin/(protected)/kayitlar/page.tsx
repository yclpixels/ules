import { prisma } from "@/lib/prisma";
import { verifyManagerSession } from "@/lib/dal";
import { AUDIT_LABELS, type AuditAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "short",
  timeStyle: "medium",
});

/** Güvenlik açısından dikkat çekmesi gereken işlemler kırmızı gösterilir. */
const ALERT_ACTIONS = new Set<string>([
  "LOGIN_FAILED",
  "ORDER_CANCELLED",
  "PAYMENT_VOIDED",
  "STAFF_PASSWORD_RESET",
]);

export default async function KayitlarPage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const session = await verifyManagerSession();
  const { sayfa } = await searchParams;
  const page = Math.max(1, Number.parseInt(sayfa || "1", 10) || 1);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { branchId: session.branchId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where: { branchId: session.branchId } }),
  ]);
  const hasNext = page * PAGE_SIZE < total;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Erişim ve İşlem Kayıtları</h1>
        <p className="text-sm text-gray-500 mt-1">
          KVKK veri güvenliği tedbirleri kapsamında tutulur: giriş denemeleri ve
          geri alınamaz işlemler. Kayıtlar değiştirilemez ve silinemez.
        </p>
      </div>

      <div className="bg-white border rounded-2xl divide-y overflow-hidden">
        {logs.map((log) => {
          const alert = ALERT_ACTIONS.has(log.action);
          return (
            <div
              key={log.id}
              className="px-4 py-3 flex justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <p
                  className={`font-medium text-sm ${
                    alert ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {AUDIT_LABELS[log.action as AuditAction] || log.action}
                </p>
                <p className="text-sm text-gray-500">
                  {log.actorName}
                  {log.detail && ` · ${log.detail}`}
                </p>
              </div>
              <div className="text-right text-xs text-gray-400 shrink-0">
                <p>{dateTimeFormatter.format(log.createdAt)}</p>
                {log.ip && <p>{log.ip}</p>}
              </div>
            </div>
          );
        })}
        {logs.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500">
            Henüz kayıt yok.
          </p>
        )}
      </div>

      {(page > 1 || hasNext) && (
        <div className="flex justify-between text-sm">
          {page > 1 ? (
            <a href={`/admin/kayitlar?sayfa=${page - 1}`} className="underline">
              ← Daha yeni
            </a>
          ) : (
            <span />
          )}
          {hasNext && (
            <a href={`/admin/kayitlar?sayfa=${page + 1}`} className="underline">
              Daha eski →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
