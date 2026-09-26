import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/baseUrl";
import { siteContent } from "@/content/site";
import { blogPosts } from "@/content/blog";
import { hasImpactData } from "@/content/impact";

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
    // Tanıtım sitesi sayfaları
    ...[
      ["/isletme-basvur", 0.9],
      ["/ules-nedir", 0.8],
      ["/uygulama", 0.8],
      ["/sss", 0.7],
      ["/blog", 0.7],
      ["/iletisim", 0.6],
      ...(hasImpactData() ? [["/etki", 0.5] as const] : []),
    ].map(([path, priority]) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: "monthly" as const,
      priority: priority as number,
    })),
    ...blogPosts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? p.publishedAt),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
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
    ...["/gizlilik-politikasi", "/kvkk", "/kullanim-sartlari", "/cerez-politikasi", "/iade-iptal", "/hesap-silme"].map((path) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
