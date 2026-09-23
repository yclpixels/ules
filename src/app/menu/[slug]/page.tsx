import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTL } from "@/lib/money";
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
  const branch = await getBranch((await params).slug);
  if (!branch) return { title: "Menü bulunamadı" };
  return {
    title: `${branch.name} — Menü`,
    description: `${branch.name} güncel menü ve fiyatlar.`,
    robots: { index: true, follow: true },
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-3">
          <h1 className="text-2xl font-semibold">{branch.name}</h1>
          {available.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {available.map((code) => (
                <Link
                  key={code}
                  href={`/menu/${slug}?lang=${code}`}
                  className={`text-xs rounded-lg px-2 py-1 border ${
                    locale === code
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600"
                  }`}
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
            <div className="bg-white border rounded-xl divide-y">
              {group.products.map((p) => {
                const t = pickTranslation(p.translations, locale);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        loading="lazy"
                        className="w-16 h-16 rounded-lg object-cover border shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{t?.name || p.name}</p>
                      {(t?.description ?? p.description) && (
                        <p className="text-sm text-gray-500">
                          {t?.description ?? p.description}
                        </p>
                      )}
                      {(t?.allergens ?? p.allergens) && (
                        <p className="text-xs text-amber-600">
                          {t?.allergens ?? p.allergens}
                        </p>
                      )}
                    </div>
                    <p className="font-medium shrink-0">
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
          Fiyatlar değişebilir. Güncel menü.
        </p>
      </main>
    </div>
  );
}
