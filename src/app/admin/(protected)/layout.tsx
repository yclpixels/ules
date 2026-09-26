import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { describeSubscription } from "@/lib/subscription";
import AdminNav, { AdminTabs, type NavGroup } from "@/components/AdminNav";
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
  // Düşük puan uyarısı: müşteri hâlâ masadayken müdahale şansı için.
  // Garsona gösterilmez — müdahale müdürün işi.
  // İki sorgu paralel: her sekme geçişinde bu yerleşim yeniden çalışıyor ve
  // veritabanına her gidiş canlıda ~150 ms tutuyor (sıralı olunca toplanıyordu).
  const [branch, lowRatingCount] = await Promise.all([
    prisma.branch.findUnique({
      where: { id: session.branchId },
      select: { subscriptionStatus: true, trialEndsAt: true },
    }),
    isManager ? countUnacknowledgedLowRatings(session.branchId) : Promise.resolve(0),
  ]);
  const subscription = branch ? describeSubscription(branch) : null;
  // "info" nötr gri (marka rengiyle çakışmasın diye artık mavi değil), "warn"
  // gerçek bir uyarı sarısı — amber-* Tailwind sınıfı marka lacivertine
  // eşlendiği için burada bilinçli olarak ham hex kullanıldı.
  const bannerTone = {
    info: "bg-gray-50 border-gray-200 text-gray-700",
    warn: "bg-[#fef3c7] border-[#fde68a] text-[#92400e]",
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
            items: [
              { href: "/admin/isletmeler", label: "İşletmeler" },
              { href: "/admin/talepler", label: "Talepler" },
            ],
          },
        ]
      : []),
    {
      title: "Yardım",
      items: [{ href: "/admin/destek", label: "Destek" }],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tanıtım sitesi ve müşteri ekranıyla aynı lacivert bant; altında
          rolün günlük ekranları her zaman görünür (menü açmadan geçiş). */}
      <header className="sticky top-0 z-20 text-white" style={{ background: "#1D126D" }}>
        <div className="max-w-4xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between gap-3">
          <Link href="/admin" className="min-w-0 flex items-center gap-2.5">
            <Logo tone="white" className="w-8 h-8 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold truncate">{session.branchName}</span>
              <span className="block text-xs text-white/60 truncate">
                {session.name} · {roleLabel(session.role)}
              </span>
            </span>
          </Link>
          <AdminNav
            groups={groups.slice(1)}
            userName={session.name}
            roleLabel={roleLabel(session.role)}
          />
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-2.5">
          <AdminTabs items={groups[0].items} />
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
