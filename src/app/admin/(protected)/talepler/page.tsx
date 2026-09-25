import Link from "next/link";
import { verifyOwnerSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { supportInbox } from "@/lib/email";
import { toggleSupportHandledAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "medium",
  timeStyle: "short",
});

function ContactLink({ contact }: { contact: string }) {
  if (/@/.test(contact)) {
    return (
      <a href={`mailto:${contact}`} className="underline">
        {contact}
      </a>
    );
  }
  if (/^[+\d\s()-]{7,}$/.test(contact)) {
    return (
      <a href={`tel:${contact.replace(/[^\d+]/g, "")}`} className="underline">
        {contact}
      </a>
    );
  }
  return <>{contact}</>;
}

/**
 * Sahip paneli: tanıtım sitesinden gelen demo talepleri ve işletmelerin
 * destek talepleri. E-posta gitmese bile talepler burada — asıl kayıt bu.
 */
export default async function TaleplerPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  await verifyOwnerSession();
  const { durum } = await searchParams;
  const showHandled = durum === "cozuldu";

  const requests = await prisma.supportRequest.findMany({
    where: { handledAt: showHandled ? { not: null } : null },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { branch: { select: { name: true } } },
  });
  const openCount = await prisma.supportRequest.count({ where: { handledAt: null } });
  const inbox = supportInbox();
  const emailConfigured = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Talepler</h1>
          <p className="text-sm text-gray-500">Demo ve destek talepleri</p>
        </div>
        <div className="flex gap-1 text-sm">
          <Link
            href="/admin/talepler"
            className={`px-3 py-1.5 rounded-lg border ${!showHandled ? "bg-white font-medium" : "text-gray-500"}`}
          >
            Açık ({openCount})
          </Link>
          <Link
            href="/admin/talepler?durum=cozuldu"
            className={`px-3 py-1.5 rounded-lg border ${showHandled ? "bg-white font-medium" : "text-gray-500"}`}
          >
            Çözülenler
          </Link>
        </div>
      </div>

      {(!inbox || !emailConfigured) && (
        <p className="bg-[#fef3c7] border border-[#fde68a] text-[#92400e] rounded-2xl px-4 py-3 text-sm">
          E-posta bildirimi kapalı (
          {!emailConfigured ? "RESEND_API_KEY tanımlı değil" : "SUPPORT_EMAIL tanımlı değil"}
          ). Talepler yine de burada birikiyor.
        </p>
      )}

      {requests.length === 0 && (
        <p className="bg-white border rounded-2xl p-6 text-center text-sm text-gray-500">
          {showHandled ? "Çözülen talep yok." : "Açık talep yok."}
        </p>
      )}

      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id} className="bg-white border rounded-2xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  <span
                    className={`inline-block text-xs rounded-full px-2 py-0.5 mr-2 align-middle ${
                      r.kind === "DEMO" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {r.kind === "DEMO" ? "Demo" : "Destek"}
                  </span>
                  {r.subject || r.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {r.branch ? `${r.branch.name} · ` : ""}
                  {/* Demo talebinde başlık zaten işletme adı; tekrar yazma. */}
                  {r.subject ? `${r.name} · ` : ""}
                  {dateTime.format(r.createdAt)}
                  {!r.emailSent && " · e-posta gitmedi"}
                </p>
              </div>
              <form action={toggleSupportHandledAction} className="shrink-0">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="handled" value={String(Boolean(r.handledAt))} />
                <button className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                  {r.handledAt ? "Tekrar aç" : "Çözüldü"}
                </button>
              </form>
            </div>
            {r.message && <p className="text-sm whitespace-pre-wrap">{r.message}</p>}
            <p className="text-sm">
              <span className="text-gray-500">İletişim: </span>
              <ContactLink contact={r.contact} />
            </p>
            {r.handledAt && (
              <p className="text-xs text-gray-400">
                {r.handledBy} çözüldü olarak işaretledi · {dateTime.format(r.handledAt)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
