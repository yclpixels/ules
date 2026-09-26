import Link from "next/link";

type Crumb = { name: string; path: string };

/**
 * Sayfa işaret yolu (Ana sayfa › Vaka Çalışmaları › …): hem görünür hem de
 * Google için BreadcrumbList yapılandırılmış verisi — arama sonucunda adres
 * yerine bu yol gösterilebilir. Son öğe bulunulan sayfadır, bağlantı olmaz.
 */
export default function Breadcrumbs({
  items,
  siteUrl,
  dark = false,
}: {
  items: Crumb[];
  siteUrl: string;
  /** Koyu zeminde (MarketingPage başlığı) açık renkli yazı. */
  dark?: boolean;
}) {
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
    <nav aria-label="Sayfa yolu" className={`text-sm ${dark ? "text-white/60" : "text-gray-500"}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true" className={dark ? "text-white/30" : "text-gray-300"}>›</span>}
            {i < all.length - 1 ? (
              <Link href={c.path} className={dark ? "hover:text-white hover:underline" : "hover:text-gray-900 hover:underline"}>
                {c.name}
              </Link>
            ) : (
              <span aria-current="page" className={`font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                {c.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
