import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { describeSubscription } from "@/lib/subscription";
import AdminNav, { type NavGroup } from "@/components/AdminNav";
import Logo from "@/components/Logo";
import { BellIcon } from "@/components/icons";
import { roleLabel } from "@/lib/roles";
import { countUnacknowledgedLowRatings } from "@/lib/feedbackAlerts";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifyAdminSession();
  const isOwner = session.role === "OWNER";
  const isManager = session.role === "MANAGER" || isOwner;

  // Abonelik/deneme durumu bandı. Süre dolsa bile panel kilitlenmez —
  // servis ortasında kapanma işletmeyi kaybettirir (bkz. lib/subscription.ts).
  const branch = await prisma.branch.findUnique({
    where: { id: session.branchId },
    select: { subscriptionStatus: true, trialEndsAt: true },
  });
  const subscription = branch ? describeSubscription(branch) : null;

  // Düşük puan uyarısı: müşteri hâlâ masadayken müdahale şansı için.
  // Garsona gösterilmez — müdahale müdürün işi.
  const lowRatingCount = isManager
    ? await countUnacknowledgedLowRatings(session.branchId)
    : 0;
  const bannerTone = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    danger: "bg-red-50 border-red-200 text-red-800",
  } as const;

  // Menü gruplanmış: garson sadece günlük işleri görür, müdüre yönetim ve
  // rapor grupları eklenir, sahibe platform grubu.
  const groups: NavGroup[] = [
    {
      title: "Günlük",
      items: [
        { href: "/admin", label: "Kasa" },
        // Mutfak garsona da açık: küçük işletmede aynı kişi hem servis hem mutfak.
        { href: "/admin/mutfak", label: "Mutfak" },
        ...(isManager
          ? [
              { href: "/admin/masalar", label: "Masalar" },
              { href: "/admin/siparisler", label: "Siparişler" },
              { href: "/admin/gun-sonu", label: "Gün Sonu" },
            ]
          : []),
      ],
    },
    ...(isManager
      ? [
          {
            title: "Yönetim",
            items: [
              { href: "/admin/urunler", label: "Ürünler" },
              { href: "/admin/personel", label: "Personel" },
              { href: "/admin/ayarlar", label: "Ayarlar" },
            ],
          },
          {
            title: "Raporlar",
            items: [
              { href: "/admin/performans", label: "Personel Performansı" },
              { href: "/admin/degerlendirmeler", label: "Değerlendirmeler" },
              { href: "/admin/kayitlar", label: "Erişim Kayıtları" },
            ],
          },
        ]
      : []),
    ...(isOwner
      ? [
          {
            title: "Platform",
            items: [{ href: "/admin/isletmeler", label: "İşletmeler" }],
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <Link href="/admin" className="min-w-0 flex items-center gap-2">
            <Logo className="w-7 h-7 shrink-0" />
            <span className="min-w-0">
              <span className="font-semibold block truncate">Üleş</span>
              <span className="text-xs text-gray-400 block truncate">
                {session.branchName}
              </span>
            </span>
          </Link>
          <AdminNav
            groups={groups}
            userName={session.name}
            roleLabel={roleLabel(session.role)}
          />
        </div>
      </header>

      {lowRatingCount > 0 && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <Link
            href="/admin/degerlendirmeler"
            className="flex items-center gap-2 border border-red-200 bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-red-100"
          >
            <BellIcon className="w-4 h-4 shrink-0" />
            <span>
              <strong>{lowRatingCount} düşük puanlı değerlendirme</strong>{" "}
              bekliyor — müşteri hâlâ masada olabilir. Görüntüle →
            </span>
          </Link>
        </div>
      )}
      {subscription?.banner && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <p
            className={`border rounded-2xl px-4 py-3 text-sm ${
              bannerTone[subscription.banner.tone]
            }`}
          >
            {subscription.banner.text}
          </p>
        </div>
      )}
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
