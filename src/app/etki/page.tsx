import MarketingPage from "@/components/marketing/MarketingPage";
import { CtaBand, SectionTitle, SOFT, MUTED, LINE, INK, INK_CARD, ON_DARK, ON_DARK_MUTED, displayFont, monoFont } from "@/components/marketing/ui";
import { impact, hasImpactData } from "@/content/impact";
import { formatPostDate } from "@/content/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Etkimiz",
  description:
    "Üleş'in restoranlara ve masadaki müşterilere etkisini ölçülmüş rakamlarla paylaştığımız sayfa: kapanan hesaplar, QR siparişler, dijital fişler.",
  path: "/etki",
  // Ölçülmüş veri girilene kadar boş sayfa dizine girmesin.
  index: hasImpactData(),
});

const nf = new Intl.NumberFormat("tr-TR");

const commitments = [
  { title: "Yalnızca ölçülmüş veri", text: "Tahmin, projeksiyon ya da \"yaklaşık\" rakam paylaşmıyoruz. Her rakam sistemin kendi kayıtlarından gelir." },
  { title: "Tarihiyle birlikte", text: "Her rakamın hangi tarih itibarıyla olduğunu yazarız; eskimiş veri güncelmiş gibi görünmez." },
  { title: "Kişisel veri yok", text: "Toplam sayılar paylaşılır; tek bir işletmenin ya da müşterinin verisi açıklanmaz." },
];

export default function EtkiPage() {
  const hasData = hasImpactData();

  return (
    <MarketingPage
      crumbs={[{ name: "Etkimiz", path: "/etki" }]}
      eyebrow="Etkimiz"
      title="Rakamları uydurmuyoruz. Ölçüyoruz."
      intro="İlk işletmelerimizle birlikte ölçmeye başladık. Veriler anlamlı hâle geldiğinde burada, tarihiyle birlikte paylaşacağız."
    >
      <section style={{ background: INK, color: ON_DARK }}>
        <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="grid gap-px overflow-hidden rounded-3xl sm:grid-cols-2" style={{ background: "rgba(255,255,255,0.08)" }}>
            {impact.stats.map((s) => (
              <div key={s.label} className="p-8 sm:p-10" style={{ background: INK_CARD }}>
                <p className="text-sm" style={{ ...monoFont, color: ON_DARK_MUTED, letterSpacing: "0.12em" }}>
                  {s.label.toLocaleUpperCase("tr-TR")}
                </p>
                <p
                  className="mt-6 text-5xl tabular-nums sm:text-6xl"
                  style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em", color: s.value === null ? "rgba(244,243,255,0.28)" : ON_DARK }}
                >
                  {s.value === null ? "Ölçülüyor" : `${nf.format(s.value)}${s.suffix ?? ""}`}
                </p>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: ON_DARK_MUTED }}>
                  {s.method}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm" style={{ color: ON_DARK_MUTED }}>
            {hasData && impact.asOf
              ? `Rakamlar ${formatPostDate(impact.asOf)} itibarıyladır.`
              : "Henüz yayınlanmış rakam yok — ilk ölçümler tamamlandığında bu alan güncellenecek."}
          </p>
        </div>
      </section>

      <section style={{ background: SOFT }}>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionTitle eyebrow="Taahhüdümüz" title="Paylaştığımız her rakamın arkasında durabilmeliyiz." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {commitments.map((c) => (
              <div key={c.title} className="rounded-3xl border bg-white p-7" style={{ borderColor: LINE }}>
                <p className="text-lg font-semibold" style={{ color: INK }}>
                  {c.title}
                </p>
                <p className="mt-2 leading-relaxed" style={{ color: MUTED }}>
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="İlk rakamların parçası olun."
        text="İlk işletmelerimizle birlikte büyüyoruz; kurulum ve eğitim bizden."
        primary={{ href: "/isletme-basvur", label: "İşletmeni Üleş'e Kat" }}
      />
    </MarketingPage>
  );
}
