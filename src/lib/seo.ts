import type { Metadata } from "next";

/**
 * Tanıtım sitesi alt sayfalarının meta verisi: başlık, açıklama, canonical,
 * Open Graph ve Twitter kartı tek yerden. Paylaşım görseli kök
 * opengraph-image'dan gelir (her sayfaya ayrıca eklemeye gerek yok).
 * Başlık kök yerleşimdeki "%s · Üleş" şablonuna girer.
 */
export function pageMetadata({
  title,
  description,
  path,
  index = true,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  type?: "website" | "article";
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index, follow: true },
    openGraph: {
      title: `${title} · Üleş`,
      description,
      url: path,
      type,
      locale: "tr_TR",
      siteName: "Üleş",
    },
    twitter: { card: "summary_large_image", title: `${title} · Üleş`, description },
  };
}
