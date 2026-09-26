import Link from "next/link";

type Crumb = { name: string; path: string };

/**
 * Sayfa işaret yolu (Ana sayfa › Vaka Çalışmaları › …): hem görünür hem de
 * Google için BreadcrumbList yapılandırılmış verisi — arama sonucunda adres
 * yerine bu yol gösterilebilir. Son öğe bulunulan sayfadır, bağlantı olmaz.
 */
export default function Breadcrumbs({ items, siteUrl }: { items: Crumb[]; siteUrl: string }) {
  const all: Crumb[] = [{ name: "Ana sayfa", path: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${siteUrl}${c.path === "/" ? "" : c.path}`,
    })),
  };

  return (
    <nav aria-label="Sayfa yolu" className="text-sm text-gray-500">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true" className="text-gray-300">›</span>}
            {i < all.length - 1 ? (
              <Link href={c.path} className="hover:text-gray-900 hover:underline">
                {c.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-gray-900 font-medium">
                {c.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
