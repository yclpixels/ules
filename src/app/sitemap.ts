import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/baseUrl";
import { siteContent } from "@/content/site";

// Veritabanı okuyor: build sırasında önceden üretilmemeli (Docker build'inde
// gerçek veritabanı yok). Site adresi tanımlıyken getBaseUrl başlık okumadığı
// için Next bunu statik sanıp build'de üretmeye çalışıyordu.
export const dynamic = "force-dynamic";

/**
 * Sadece gerçekten herkese açık sayfalar: tanıtım sitesi + yayında olan
 * (menuSlug dolu) şube menüleri. Masa/admin/fiş linkleri buraya bilerek
 * girmez (bkz. robots.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl();

  const branches = await prisma.branch.findMany({
    where: { menuSlug: { not: null } },
    select: { menuSlug: true },
  });

  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...branches.map((b) => ({
      url: `${baseUrl}/menu/${b.menuSlug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    // Vaka çalışmaları (yalnızca gerçek içerik girildiyse; src/content/site.ts)
    ...(siteContent.caseStudies.length > 0
      ? [
          { url: `${baseUrl}/vaka-calismalari`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
          ...siteContent.caseStudies.map((c) => ({
            url: `${baseUrl}/vaka-calismalari/${c.slug}`,
            lastModified: new Date(c.publishedAt),
            changeFrequency: "yearly" as const,
            priority: 0.6,
          })),
        ]
      : []),
    // Platformun kendi yasal sayfaları (arama motorlarına açık; restoran
    // şablonları /gizlilik ve /on-bilgilendirme kapalı, burada yok).
    ...["/gizlilik-politikasi", "/kullanim-sartlari", "/cerez-politikasi"].map((path) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
