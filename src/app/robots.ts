import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/baseUrl";

/**
 * QR/masa/admin/fiş linkleri kişiye özel ve tahmin edilebilir olmamalı —
 * bunlar zaten sayfa bazında `robots: noindex` taşıyor (bkz. layout.tsx),
 * ama arama motoru botlarının bu yolları hiç TARAMAMASI için burada da
 * engelleniyor. Tanıtım sitesi (/) ve herkese açık menüler (/menu) bilerek açık.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/menu/"],
      disallow: ["/admin", "/masa/", "/fis/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
