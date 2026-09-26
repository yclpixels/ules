import MarketingPage from "@/components/marketing/MarketingPage";
import Faq from "@/components/marketing/Faq";
import { CtaBand, SOFT, displayFont } from "@/components/marketing/ui";
import { faqGroups, allFaqs } from "@/content/faq";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sık Sorulan Sorular",
  description:
    "Üleş QR menü, masadan sipariş, hesap bölüşme ve ödeme hakkında merak edilenler: uygulama gerekir mi, ödeme nasıl yapılır, para kimin hesabına yatar?",
  path: "/sss",
});

export default function SssPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <MarketingPage
      crumbs={[{ name: "SSS", path: "/sss" }]}
      eyebrow="Sık sorulan sorular"
      title="Aklınıza takılanlar."
      intro="Müşteriler, işletmeler ve ödeme güvenliği hakkında en çok sorulan sorular."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <section style={{ background: SOFT }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[220px_1fr] lg:gap-16">
          {/* Konu atlama — masaüstünde yapışkan */}
          <nav aria-label="Konular" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {faqGroups.map((g) => (
                <li key={g.id}>
                  <a
                    href={`#${g.id}`}
                    className="inline-flex h-10 items-center rounded-full border bg-white px-4 text-sm font-medium transition-colors hover:bg-[#F7F6FC] lg:w-full lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-3"
                  >
                    {g.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-14">
            {faqGroups.map((g) => (
              <div key={g.id} id={g.id} className="scroll-mt-24">
                <h2
                  className="mb-5 text-2xl sm:text-3xl"
                  style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.02em" }}
                >
                  {g.title}
                </h2>
                <Faq items={g.items} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand
        title="Cevabını bulamadınız mı?"
        text="Bize yazın; genellikle aynı gün içinde dönüyoruz."
        primary={{ href: "/iletisim", label: "İletişime geçin" }}
        secondary={{ href: "/isletme-basvur", label: "İşletme başvurusu" }}
      />
    </MarketingPage>
  );
}
