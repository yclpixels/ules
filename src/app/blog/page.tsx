import Link from "next/link";
import MarketingPage from "@/components/marketing/MarketingPage";
import { SOFT, MUTED, LINE, displayFont, monoFont } from "@/components/marketing/ui";
import { BLOG_CATEGORIES, formatPostDate, sortedPosts, type BlogCategory } from "@/content/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Blog",
  description:
    "Restoran ve kafe işletmecileri için rehberler: QR menü, masadan sipariş, hesap bölüşme, restoranlarda gıda israfını azaltma ve Üleş'ten haberler.",
  path: "/blog",
});

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const active = (BLOG_CATEGORIES as readonly string[]).includes(kategori ?? "")
    ? (kategori as BlogCategory)
    : null;
  const all = sortedPosts();
  const posts = active ? all.filter((p) => p.category === active) : all;
  const counts = new Map(BLOG_CATEGORIES.map((c) => [c, all.filter((p) => p.category === c).length]));

  const chip = (href: string, label: string, on: boolean) => (
    <Link
      href={href}
      scroll={false}
      aria-current={on ? "page" : undefined}
      className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
        on ? "border-[#1D126D] bg-[#1D126D] text-white" : "bg-white hover:bg-[#F7F6FC]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <MarketingPage
      crumbs={[{ name: "Blog", path: "/blog" }]}
      eyebrow="Blog"
      title="Restoranlar için pratik rehberler."
      intro="QR menüden hesap bölüşmeye, mutfak düzeninden gıda israfına — işletmenizi kolaylaştıracak yazılar."
    >
      <section style={{ background: SOFT }}>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <nav aria-label="Kategoriler" className="flex flex-wrap gap-2">
            {chip("/blog", "Tümü", !active)}
            {BLOG_CATEGORIES.filter((c) => counts.get(c)).map((c) =>
              chip(`/blog?kategori=${encodeURIComponent(c)}`, c, active === c)
            )}
          </nav>

          {posts.length === 0 ? (
            <div className="mt-10 rounded-3xl border bg-white p-10 text-center">
              <p className="text-lg font-semibold">Bu kategoride henüz yazı yok.</p>
              <p className="mt-2" style={{ color: MUTED }}>
                Yakında burada olacak.{" "}
                <Link href="/blog" className="font-semibold text-[#1D126D] underline underline-offset-2">
                  Tüm yazılara dönün
                </Link>
              </p>
            </div>
          ) : (
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {posts.map((p, i) => (
                <li key={p.slug} className={i === 0 && !active ? "md:col-span-2" : ""}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="group flex h-full flex-col rounded-3xl border bg-white p-7 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_rgba(8,6,26,0.35)] sm:p-9"
                    style={{ borderColor: LINE }}
                  >
                    <span className="text-xs uppercase" style={{ ...monoFont, color: MUTED, letterSpacing: "0.18em" }}>
                      {p.category}
                    </span>
                    <h2
                      className={`mt-4 leading-tight group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 ${
                        i === 0 && !active ? "text-2xl sm:text-4xl" : "text-2xl"
                      }`}
                      style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.02em" }}
                    >
                      {p.title}
                    </h2>
                    <p className="mt-3 flex-1 leading-relaxed" style={{ color: MUTED }}>
                      {p.description}
                    </p>
                    <p className="mt-6 text-sm" style={{ color: MUTED }}>
                      <time dateTime={p.publishedAt}>{formatPostDate(p.publishedAt)}</time> · {p.readingMinutes} dk okuma
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </MarketingPage>
  );
}
