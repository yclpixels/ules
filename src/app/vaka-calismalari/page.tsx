import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SubPage from "@/components/marketing/SubPage";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Vaka Çalışmaları",
  description:
    "Üleş QR menü, masadan sipariş ve ödeme sistemini kullanan restoran ve kafelerin ölçülmüş sonuçları.",
  alternates: { canonical: "/vaka-calismalari" },
  robots: { index: true, follow: true },
};

/**
 * Vaka çalışmaları listesi. İçerik src/content/site.ts'ten gelir; henüz
 * gerçek bir vaka yoksa sayfa 404 döner (boş ya da uydurma sayfa yayınlanmaz).
 */
export default function VakaCalismalariPage() {
  const cases = siteContent.caseStudies;
  if (cases.length === 0) notFound();

  return (
    <SubPage
      crumbs={[{ name: "Vaka Çalışmaları", path: "/vaka-calismalari" }]}
      title="Vaka çalışmaları"
      intro="Üleş'i kullanan işletmelerin ölçülmüş sonuçları."
    >
      <div className="grid gap-4">
        {cases.map((c) => (
          <Link
            key={c.slug}
            href={`/vaka-calismalari/${c.slug}`}
            className="block rounded-2xl border p-6 transition-shadow hover:shadow-lg"
          >
            <p className="text-sm text-gray-500">
              {c.business} · {c.city}
            </p>
            <h2 className="mt-2 text-xl font-bold">{c.title}</h2>
            <p className="mt-2 text-gray-600">{c.summary}</p>
          </Link>
        ))}
      </div>
    </SubPage>
  );
}
