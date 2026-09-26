import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import { MobileStickyCta, SiteFooter, SiteHeader } from "@/components/marketing/SiteChrome";
import { siteUrl } from "@/components/marketing/SubPage";
import { CtaBand, MUTED, LINE, SOFT, INK, displayFont, monoFont } from "@/components/marketing/ui";
import { blogPosts, formatPostDate, getPost, sortedPosts, type BlogBlock } from "@/content/blog";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) return {};
  const base = pageMetadata({ title: post.title, description: post.description, path: `/blog/${post.slug}`, type: "article" });
  return {
    ...base,
    // Yazı başlıkları zaten uzun: " · Üleş" eki arama sonucunda kesilmesin.
    title: { absolute: post.title },
    openGraph: { ...base.openGraph, type: "article" as const, publishedTime: post.publishedAt, modifiedTime: post.updatedAt ?? post.publishedAt },
  };
}

function Block({ b }: { b: BlogBlock }) {
  switch (b.type) {
    case "h2":
      return (
        <h2 className="mt-12 text-2xl sm:text-3xl" style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.02em", color: INK }}>
          {b.text}
        </h2>
      );
    case "p":
      return <p className="mt-5">{b.text}</p>;
    case "ul":
      return (
        <ul className="mt-5 list-disc space-y-2 pl-6 marker:text-[#7C6CFF]">
          {b.items.map((i) => <li key={i}>{i}</li>)}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-5 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-[#1D126D]">
          {b.items.map((i) => <li key={i}>{i}</li>)}
        </ol>
      );
    case "note":
      return (
        <p className="mt-8 rounded-2xl border-l-4 border-[#7C6CFF] p-5 text-base" style={{ background: SOFT, color: INK }}>
          {b.text}
        </p>
      );
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const url = siteUrl();
  const others = sortedPosts().filter((p) => p.slug !== post.slug).slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: "tr-TR",
    mainEntityOfPage: `${url}/blog/${post.slug}`,
    author: { "@type": "Organization", name: "Üleş", url },
    publisher: { "@type": "Organization", name: "Üleş", logo: { "@type": "ImageObject", url: `${url}/logo.png` } },
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-white" style={{ color: INK }}>
      <SiteHeader />
      <main>
        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
          <Breadcrumbs
            items={[
              { name: "Blog", path: "/blog" },
              { name: post.title, path: `/blog/${post.slug}` },
            ]}
            siteUrl={url}
          />
          <p className="mt-10 text-xs uppercase" style={{ ...monoFont, color: MUTED, letterSpacing: "0.18em" }}>
            {post.category}
          </p>
          <h1 className="mt-4 text-[34px] leading-[1.1] sm:text-5xl" style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {post.title}
          </h1>
          <p className="mt-5 text-sm" style={{ color: MUTED }}>
            <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time> · {post.readingMinutes} dk okuma
          </p>
          <div className="mt-8 border-t pt-2 text-lg leading-[1.75] text-[#39384E]" style={{ borderColor: LINE }}>
            {post.body.map((b, i) => (
              <Block key={i} b={b} />
            ))}
          </div>
          {post.sources && post.sources.length > 0 && (
            <div className="mt-12 border-t pt-6 text-sm" style={{ borderColor: LINE, color: MUTED }}>
              <p className="font-semibold text-gray-900">Kaynaklar</p>
              <ul className="mt-2 space-y-1">
                {post.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener" className="underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        {others.length > 0 && (
          <section style={{ background: SOFT }}>
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
              <h2 className="text-2xl" style={{ ...displayFont, fontWeight: 800 }}>
                Diğer yazılar
              </h2>
              <ul className="mt-6 grid gap-4 md:grid-cols-2">
                {others.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`} className="block h-full rounded-3xl border bg-white p-7 transition-shadow hover:shadow-lg" style={{ borderColor: LINE }}>
                      <span className="text-xs uppercase" style={{ ...monoFont, color: MUTED, letterSpacing: "0.18em" }}>
                        {p.category}
                      </span>
                      <p className="mt-3 text-xl font-semibold leading-snug">{p.title}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <CtaBand
          title="Bunları işletmenizde denemek ister misiniz?"
          text="QR menü, masadan sipariş ve hesap bölüşme — kurulum ve eğitim bizden."
          primary={{ href: "/isletme-basvur", label: "İşletmeni Üleş'e Kat" }}
          secondary={{ href: "/uygulama", label: "Ekranları inceleyin" }}
        />
      </main>
      <SiteFooter />
      <MobileStickyCta />
    </div>
  );
}
