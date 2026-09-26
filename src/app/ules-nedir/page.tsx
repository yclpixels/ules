import MarketingPage from "@/components/marketing/MarketingPage";
import HeroMockup from "@/components/marketing/HeroMockup";
import PaymentMockup from "@/components/marketing/PaymentMockup";
import {
  CtaBand,
  SectionTitle,
  INK,
  INK_CARD,
  SOFT,
  MUTED,
  LINE,
  ON_DARK,
  ON_DARK_MUTED,
  BRAND,
  displayFont,
  monoFont,
} from "@/components/marketing/ui";
import { UsersIcon, BuildingIcon, ClipboardIcon } from "@/components/icons";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Üleş Nedir?",
  description:
    "Üleş, restoran ve kafelerde menüyü QR'a taşıyan, siparişi mutfağa ileten ve hesabı masada bölüşüp ödemeyi sağlayan sistemdir. Hikayemiz ve ilkelerimiz.",
  path: "/ules-nedir",
});

const problems = [
  { title: "Hesap beklemek", text: "Yemek bitti, masa kalkmak istiyor; ama adisyon, POS cihazı ve bozuk para için dakikalarca beklenir." },
  { title: "Bölüşmek zor", text: "Kim ne yedi, kim ne kadar verecek? Kalabalık masalarda hesap bölüşmek başlı başına bir iş." },
  { title: "Garson her yere yetişemez", text: "Sipariş almak, hesap getirmek, POS dolaştırmak — yoğun saatte hepsi aynı kişinin üzerinde." },
];

const values = [
  {
    icon: UsersIcon,
    who: "Müşteri",
    text: "Menüyü telefonunda görür, istediği an sipariş verir, hesabını arkadaşlarıyla adil bölüşür ve beklemeden öder.",
  },
  {
    icon: BuildingIcon,
    who: "İşletme",
    text: "Masalar daha hızlı döner, sipariş mutfağa hatasız ulaşır; ödeme doğrudan kendi hesabına yatar, gün sonu raporu hazır olur.",
  },
  {
    icon: ClipboardIcon,
    who: "Personel",
    text: "Hesap taşımak ve POS dolaştırmak yerine müşteriyle ilgilenir. Kim ne ekledi, kim ne aldı — her işlem kayıtlı ve adil.",
  },
];

const principles = [
  { title: "Para doğrudan işletmeye", text: "Kartlı tahsilat iyzico'nun lisanslı altyapısıyla işletmenin kendi hesabına yapılır. Para Üleş'ten geçmez." },
  { title: "Kart bilgisi bize gelmez", text: "Kart, iyzico'nun güvenli ödeme formuna girilir. Ne bizim ne de işletmenin sunucusuna uğrar." },
  { title: "Uygulama indirmek yok", text: "Masadaki QR kod her telefonda tarayıcıyla açılır. Üyelik de gerekmez." },
  { title: "Uydurma yok", text: "Sitemizde gösterdiğimiz her ekran çalışan üründen. Rakam paylaştığımızda ölçülmüş rakam olacak." },
];

export default function UlesNedirPage() {
  return (
    <MarketingPage
      crumbs={[{ name: "Üleş Nedir?", path: "/ules-nedir" }]}
      eyebrow="Üleş nedir"
      title="Hesap beklemek, yemekten uzun sürmesin."
      intro="Üleş; restoran ve kafelerde menüyü QR'a taşıyan, siparişi mutfağa ileten ve hesabı masada bölüşüp ödemeyi sağlayan sistemdir."
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
      {/* Adın hikayesi */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-[64px] leading-none sm:text-[96px]" style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.04em", color: BRAND }}>
              üleşmek
            </p>
            <p className="mt-3 text-sm" style={{ ...monoFont, color: MUTED, letterSpacing: "0.08em" }}>
              fiil · bir şeyi aralarında paylaşmak, bölüşmek
            </p>
          </div>
          <div className="space-y-5 text-lg leading-relaxed" style={{ color: MUTED }}>
            <p>
              Adımızı Türkçedeki <em>üleşmek</em> fiilinden aldık: bir sofradaki yemeği,
              bir hesabı, bir emeği aralarında adil biçimde paylaşmak.
            </p>
            <p>
              Restoranda da aynı şeyi yapmak istedik: masadaki herkes menüyü aynı anda
              görsün, siparişini kendisi versin, hesabı kendi payına göre bölüşsün ve
              beklemeden ödesin. İşletme de bu sırada siparişi mutfakta, parayı kendi
              hesabında görsün.
            </p>
          </div>
        </div>
      </section>

      {/* Sorun */}
      <section style={{ background: SOFT }}>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionTitle eyebrow="Sorun" title="Yemek güzeldi. Sonra hesap geldi." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {problems.map((p, i) => (
              <div key={p.title} className="rounded-3xl border bg-white p-7">
                <span className="text-sm" style={{ ...monoFont, color: MUTED }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-6 text-xl font-semibold">{p.title}</p>
                <p className="mt-2 leading-relaxed" style={{ color: MUTED }}>
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Üç taraf */}
      <section style={{ background: INK, color: ON_DARK }}>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionTitle
            dark
            eyebrow="Kim kazanır"
            title="Masadaki herkes için daha iyi."
            intro="Üleş aynı anda üç tarafın işini kolaylaştırmak için tasarlandı."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.who} className="rounded-3xl p-7" style={{ background: INK_CARD, border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: "rgba(124,108,255,0.16)", color: "#B9AEFF" }}>
                  <v.icon className="h-5 w-5" />
                </span>
                <p className="mt-6 text-xl font-semibold">{v.who}</p>
                <p className="mt-2 leading-relaxed" style={{ color: ON_DARK_MUTED }}>
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İlkeler */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionTitle eyebrow="İlkelerimiz" title="Güveni sözle değil, tasarımla kuruyoruz." />
          <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="border-t pt-6" style={{ borderColor: LINE }}>
                <dt className="text-lg font-semibold" style={{ color: INK }}>
                  {p.title}
                </dt>
                <dd className="mt-2 leading-relaxed" style={{ color: MUTED }}>
                  {p.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CtaBand
        title="İşletmenizde görmek ister misiniz?"
        text="Menünüzü ve masalarınızı birlikte kuralım; kurulum ve personel eğitimi bizden."
        primary={{ href: "/isletme-basvur", label: "İşletmeni Üleş'e Kat" }}
        secondary={{ href: "/uygulama", label: "Ekranları inceleyin" }}
      />
    </MarketingPage>
  );
}
