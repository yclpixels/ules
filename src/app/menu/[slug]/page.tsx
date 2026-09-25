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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EmbedAutoHeight />
      <header className="bg-white border-b px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">{branch.name}</h1>
          {available.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {available.map((code) => (
                <Link
                  key={code}
                  href={`/menu/${slug}?lang=${code}`}
                  className={`text-xs rounded-lg px-2 py-1 border transition-colors ${
                    locale === code
                      ? "text-white border-transparent"
                      : "bg-white text-gray-600"
                  }`}
                  style={
                    locale === code
                      ? { background: "linear-gradient(135deg, #fbbf24, #f87171)" }
                      : undefined
                  }
                >
                  {LOCALE_LABELS[code] || code}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {groups.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            Menü henüz hazır değil.
          </p>
        )}

        {groups.map((group) => (
          <section key={group.id}>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              {group.name}
            </h2>
            <div className="bg-white border rounded-2xl divide-y overflow-hidden">
              {group.products.map((p) => {
                const t = pickTranslation(p.translations, locale);
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
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
                      {(t?.allergens ?? p.allergens) && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          {t?.allergens ?? p.allergens}
                        </p>
                      )}
                      <p className="text-sm font-medium mt-1">
                        {formatTL(p.priceCents)}
                      </p>
                    </div>
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
          Fiyatlar değişebilir. Güncel menü.
        </p>
      </main>
    </div>
  );
}
