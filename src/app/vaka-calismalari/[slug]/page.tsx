import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SubPage from "@/components/marketing/SubPage";
import { siteContent } from "@/content/site";

function findCase(slug: string) {
  return siteContent.caseStudies.find((c) => c.slug === slug);
}

export function generateStaticParams() {
  return siteContent.caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const c = findCase((await params).slug);
  if (!c) return { title: "Vaka çalışması bulunamadı" };
  return {
    title: `${c.business}: ${c.title}`,
    description: c.summary,
    alternates: { canonical: `/vaka-calismalari/${c.slug}` },
    robots: { index: true, follow: true },
    openGraph: { title: `${c.business}: ${c.title}`, description: c.summary, type: "article" },
  };
}

/** Tek vaka çalışması: ölçülmüş sonuçlar + hikâye (src/content/site.ts). */
export default async function VakaPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = findCase((await params).slug);
  if (!c) notFound();

  return (
    <SubPage
      crumbs={[
        { name: "Vaka Çalışmaları", path: "/vaka-calismalari" },
        { name: c.business, path: `/vaka-calismalari/${c.slug}` },
      ]}
      title={c.title}
      intro={
        <span>
          {c.business} · {c.city}
        </span>
      }
    >
      {c.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.photo} alt={c.business} className="mb-8 w-full rounded-2xl object-cover" />
      )}
      {c.results.length > 0 && (
        <dl className="mb-10 grid gap-3 sm:grid-cols-2">
          {c.results.map(([label, value]) => (
            <div key={label} className="rounded-2xl border bg-gray-50 p-5">
              <dt className="text-sm text-gray-500">{label}</dt>
              <dd className="mt-1 text-2xl font-bold" style={{ color: "#1D126D" }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="space-y-5 text-lg leading-relaxed text-gray-700">
        {c.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </SubPage>
  );
}
