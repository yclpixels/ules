import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/baseUrl";

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

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    ...branches.map((b) => ({
      url: `${baseUrl}/menu/${b.menuSlug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
