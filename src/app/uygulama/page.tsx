import MarketingPage from "@/components/marketing/MarketingPage";
import HeroMockup from "@/components/marketing/HeroMockup";
import PaymentMockup from "@/components/marketing/PaymentMockup";
import LivePreviewFrame from "@/components/marketing/LivePreviewFrame";
import PanelShowcase from "@/components/marketing/PanelShowcase";
import {
  ButtonLink,
  Check,
  CtaBand,
  SectionTitle,
  SOFT,
  MUTED,
  LINE,
  INK,
  displayFont,
  monoFont,
} from "@/components/marketing/ui";
import { QrIcon, CartIcon, SplitIcon, ReceiptIcon } from "@/components/icons";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Müşteri Ekranı ve Paneller",
  description:
    "Üleş'i kullanmak için uygulama indirmeye gerek yok: masadaki QR kod menüyü, siparişi ve ödemeyi telefonun tarayıcısında açar. Ekranları inceleyin.",
  path: "/uygulama",
});

const DEMO_MENU_SLUG = process.env.DEMO_MENU_SLUG || "ana-sube-deneme";

const steps = [
  { icon: QrIcon, title: "QR'ı okutun", text: "Telefonun kamerasını masadaki koda tutun; menü tarayıcıda açılır." },
  { icon: CartIcon, title: "Sipariş verin", text: "Sepetinizi doldurun, notunuzu yazın, tek seferde gönderin. Sipariş mutfağa düşer." },
  { icon: SplitIcon, title: "Bölüşün, ödeyin", text: "Hesabı eşit, kalem kalem ya da tutar girerek bölüşün; payınızı ödeyin." },
];

const screens = [
  { tag: "01", title: "Menü ve sipariş", text: "Fotoğraflı, açıklamalı, telefonun diline göre çok dilli menü. Biten ürün görünmez.", visual: "menu" as const },
  { tag: "02", title: "Hesap bölüşme", text: "Kalan tutar herkesin ekranında canlı güncellenir; aynı kalem iki kez ödenemez.", visual: "payment" as const },
  { tag: "03", title: "Gerçek menü, canlı", text: "Bu telefon bir görsel değil: çalışan bir menü sayfası. Kaydırıp gezebilirsiniz.", visual: "live" as const },
];

const perks = [
  "Uygulama indirmek, üye olmak yok",
  "Garsonu beklemeden sipariş ve ödeme",
  "Herkes yalnızca kendi payını öder",
  "Kart bilgisi iyzico'nun güvenli formuna girilir",
  "Fiş isterseniz e-postanıza gelir",
  "Türkçe, İngilizce ve daha fazla dilde menü",
];

export default function UygulamaPage() {
  return (
    <MarketingPage
      crumbs={[{ name: "Uygulama", path: "/uygulama" }]}
      eyebrow="Müşteri ekranı"
      title="İndirmeye gerek yok. Üleş zaten cebinizde."
      intro="Masadaki QR kod; menüyü, siparişi ve ödemeyi telefonun tarayıcısında açar. Mağazadan uygulama indirmek ya da üye olmak gerekmez."
      aside={
        <div className="relative mx-auto h-[360px] w-full max-w-[420px] sm:h-[440px]">
          <div
            aria-hidden="true"
            className="absolute inset-[-8%]"
            style={{ background: "radial-gradient(closest-side, rgba(124,108,255,0.35), transparent)" }}
          />
          <HeroMockup className="absolute left-[2%] top-6 w-[52%] -rotate-[6deg]" />
          <PaymentMockup className="absolute right-[2%] top-0 w-[52%] rotate-[5deg]" />
        </div>
      }
    >
      {/* Nasıl çalışır */}
      <section id="nasil-calisir" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionTitle eyebrow="Nasıl çalışır" title="Üç adımda masadan ödeme." center />
          <ol className="mt-14 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-3xl border p-7" style={{ background: SOFT, borderColor: LINE }}>
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1D126D] text-white">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm" style={{ ...monoFont, color: MUTED }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-8 text-xl font-semibold">{s.title}</p>
                <p className="mt-2 leading-relaxed" style={{ color: MUTED }}>
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Ekranlar */}
      <section style={{ background: SOFT }}>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionTitle
            eyebrow="Ekranlar"
            title="Müşterinin gördüğü."
            intro="Aşağıdaki ekranlar çalışan ürünün kendisi; üçüncü telefon gerçek bir menü sayfasını canlı gösteriyor."
            center
          />
          <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-6">
            {screens.map((s) => (
              <figure key={s.tag} className="flex flex-col items-center text-center">
                <div className="flex h-[480px] w-full items-center justify-center sm:h-[600px]">
                  {s.visual === "menu" && <HeroMockup className="h-full w-auto max-w-[260px]" />}
                  {s.visual === "payment" && <PaymentMockup className="h-full w-auto max-w-[260px]" />}
                  {s.visual === "live" && <LivePreviewFrame src={`/menu/${DEMO_MENU_SLUG}`} />}
                </div>
                <figcaption className="mt-6 max-w-xs">
                  <span className="text-xs" style={{ ...monoFont, color: MUTED, letterSpacing: "0.2em" }}>
                    {s.tag}
                  </span>
                  <p className="mt-2 text-lg font-semibold">{s.title}</p>
                  <p className="mt-1 leading-relaxed" style={{ color: MUTED }}>
                    {s.text}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <ButtonLink href={`/menu/${DEMO_MENU_SLUG}`}>Canlı menüyü tam ekran açın</ButtonLink>
          </div>
        </div>
      </section>

      {/* Avantajlar + mağaza notu */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionTitle eyebrow="Müşteri için" title="Beklemeden, adil, güvenli." />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {perks.map((p) => (
                <li key={p} className="flex gap-3">
                  <Check />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="self-start rounded-3xl border p-7 sm:p-9" style={{ borderColor: LINE, background: SOFT }}>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white" style={{ color: INK }}>
              <ReceiptIcon className="h-5 w-5" />
            </span>
            <p className="mt-6 text-2xl" style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.02em" }}>
              App Store ya da Google Play&apos;de arıyorsanız…
            </p>
            <p className="mt-3 leading-relaxed" style={{ color: MUTED }}>
              Müşteriler için ayrı bir uygulamamız yok — bilerek. Masada QR okutan
              herkesin telefonunda zaten bir kamera ve tarayıcı var; indirme, üyelik
              ve güncelleme derdi olmadan her telefonda aynı şekilde çalışır.
            </p>
          </div>
        </div>
      </section>

      {/* Personel ekranları */}
      <section style={{ background: SOFT }}>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionTitle
            eyebrow="İşletme için"
            title="Kasa, garson ve mutfak ekranları."
            intro="Personel ekranları da tarayıcıda açılır: tablet, telefon ya da bilgisayar yeterli."
            center
          />
          <div className="mt-14">
            <PanelShowcase />
          </div>
        </div>
      </section>

      <CtaBand
        title="Masalarınızda görmek ister misiniz?"
        text="Menünüzü ve masalarınızı birlikte kuralım; QR kartlarınız panelden yazdırılmaya hazır çıkar."
        primary={{ href: "/isletme-basvur", label: "İşletmeni Üleş'e Kat" }}
        secondary={{ href: "/sss", label: "Sık sorulan sorular" }}
      />
    </MarketingPage>
  );
}
