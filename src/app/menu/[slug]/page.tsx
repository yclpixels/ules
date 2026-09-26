import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTL } from "@/lib/money";
import { getBaseUrl } from "@/lib/baseUrl";
import EmbedAutoHeight from "@/components/EmbedAutoHeight";
import {
  LOCALE_LABELS,
  parseLocales,
  pickTranslation,
  resolveLocale,
} from "@/lib/locales";

export const dynamic = "force-dynamic";

const BRAND = "#1D126D";

/**
 * Herkese açık menü sayfası.
 *
 * Masaya bağlı değil: işletme bu adresi kendi sitesine gömebilir, sitesi
 * yoksa Instagram biyografisinde / WhatsApp'ta paylaşır. Hesap, ödeme ve
 * sipariş burada YOK — sadece menü. Masadaki QR akışı ayrı (`/masa/[qrToken]`).
 *
 * Uygulamanın geri kalanı arama motorlarına kapalı (QR linkleri özel), ama
 * burası bilerek açık: işletmenin menüsünün Google'da çıkması istenen şey.
 */
async function getBranch(slug: string) {
  return prisma.branch.findUnique({
    where: { menuSlug: slug },
    select: {
      id: true,
      name: true,
      supportedLocales: true,
      websiteUrl: true,
      legalName: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const branch = await getBranch(slug);
  if (!branch) return { title: "Menü bulunamadı" };
  const title = `${branch.name} — Menü`;
  const description = `${branch.name} güncel menü ve fiyatlar.`;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/menu/${slug}` },
    openGraph: { title, description, type: "website", url: `/menu/${slug}` },
  };
}

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const branch = await getBranch(slug);
  if (!branch) notFound();

  const available = parseLocales(branch.supportedLocales);
  const locale = resolveLocale((await searchParams).lang, available);

  const categories = await prisma.category.findMany({
    where: { branchId: branch.id },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: true,
      products: {
        where: { isAvailable: true },
        orderBy: { name: "asc" },
        include: { translations: true },
      },
    },
  });

  const uncategorized = await prisma.product.findMany({
    where: { isAvailable: true, categoryId: null, branchId: branch.id },
    orderBy: { name: "asc" },
    include: { translations: true },
  });

  const groups = [
    ...categories
      .filter((c) => c.products.length > 0)
      .map((c) => ({
        id: c.id,
        name: pickTranslation(c.translations, locale)?.name || c.name,
        products: c.products,
      })),
    ...(uncategorized.length > 0
      ? [{ id: "other", name: "Diğer", products: uncategorized }]
      : []),
  ];

  // Google'ın menü zengin sonuçları için yapılandırılmış veri (Restaurant/Menu).
  const baseUrl = await getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: branch.name,
    url: `${baseUrl}/menu/${slug}`,
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: groups.map((g) => ({
        "@type": "MenuSection",
        name: g.name,
        hasMenuItem: g.products.map((p) => {
          const t = pickTranslation(p.translations, locale);
          return {
            "@type": "MenuItem",
            name: t?.name || p.name,
            ...((t?.description ?? p.description) && {
              description: t?.description ?? p.description,
            }),
            offers: {
              "@type": "Offer",
              price: (p.priceCents / 100).toFixed(2),
              priceCurrency: "TRY",
            },
          };
        }),
      })),
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        // "<" kaçışlanır: ürün/şube adı "</script>" içerirse script bloğundan
        // çıkıp sayfada kod çalıştırabilirdi (adları müdür yazıyor, sayfa herkese açık).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <EmbedAutoHeight />
      <header className="text-white px-4 pt-6 pb-5" style={{ background: BRAND }}>
        <div className="max-w-2xl mx-auto flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight">{branch.name}</h1>
            <p className="text-sm text-white/70 mt-1">Menü ve fiyatlar</p>
          </div>
          {available.length > 1 && (
            <div className="flex gap-1 shrink-0">
              {available.map((code) => (
                <Link
                  key={code}
                  href={`/menu/${slug}?lang=${code}`}
                  aria-label={LOCALE_LABELS[code] || code}
                  aria-current={locale === code ? "true" : undefined}
                  className={`h-9 min-w-9 inline-flex items-center justify-center rounded-full px-2.5 text-xs font-semibold ${
                    locale === code ? "bg-white text-[#1D126D]" : "bg-white/10 text-white/80"
                  }`}
                >
                  {code.toUpperCase()}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Kategori şeridi: bölüme atlama (gömülü iframe'de de çalışır). */}
      {groups.length > 1 && (
        <nav className="sticky top-0 z-10 bg-white border-b">
          <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto px-4 py-2">
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#kategori-${g.id}`}
                className="shrink-0 h-9 inline-flex items-center rounded-full border px-3.5 text-sm font-medium text-gray-700"
              >
                {g.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-7">
        {groups.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            Menü henüz hazır değil.
          </p>
        )}

        {groups.map((group) => (
          <section key={group.id} id={`kategori-${group.id}`} className="scroll-mt-16">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{group.name}</h2>
            <div className="bg-white border rounded-2xl divide-y overflow-hidden">
              {group.products.map((p) => {
                const t = pickTranslation(p.translations, locale);
                const allergens = t?.allergens ?? p.allergens;
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={t?.name || p.name}
                        loading="lazy"
                        className="w-20 h-20 rounded-xl object-cover border shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{t?.name || p.name}</p>
                      {(t?.description ?? p.description) && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                          {t?.description ?? p.description}
                        </p>
                      )}
                      {allergens && (
                        <p className="text-xs text-[#92400e] mt-1">Alerjen: {allergens}</p>
                      )}
                    </div>
                    <p className="shrink-0 self-start text-base font-bold" style={{ color: BRAND }}>
                      {formatTL(p.priceCents)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {branch.websiteUrl && (
          <p className="text-center text-sm">
            <a
              href={branch.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-gray-500"
            >
              {branch.name} web sitesi
            </a>
          </p>
        )}

        <p className="text-center text-xs text-gray-400 pt-4">
          Fiyatlar değişebilir.
        </p>
      </main>
    </div>
  );
}
