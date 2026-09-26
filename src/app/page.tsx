import type { Metadata } from "next";
import type { ReactNode } from "react";
import ContactForm from "@/components/ContactForm";
import { MobileStickyCta, SiteFooter, SiteHeader } from "@/components/marketing/SiteChrome";
import { hasAddress, siteContent } from "@/content/site";
import CleanHashLinks from "@/components/marketing/CleanHashLinks";
import HeroMockup from "@/components/marketing/HeroMockup";
import PaymentMockup from "@/components/marketing/PaymentMockup";
import KitchenMockup from "@/components/marketing/KitchenMockup";
import LivePreviewFrame from "@/components/marketing/LivePreviewFrame";
import Faq from "@/components/marketing/Faq";
import PanelShowcase from "@/components/marketing/PanelShowcase";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";
import {
  QrIcon,
  SplitIcon,
  ShieldIcon,
  BellIcon,
  ImageIcon,
  CodeIcon,
  BuildingIcon,
  ClipboardIcon,
  CardIcon,
  WalletIcon,
  ReceiptIcon,
  CheckCircleIcon,
} from "@/components/icons";

// Uygulamanın geri kalanı (admin/masa/fiş) arama motorlarına kapalı
// (bkz. layout.tsx); tanıtım sitesi bilerek açık — bulunmak istenen sayfa bu.
// SEO: başlık ve açıklama, restoran/kafe sahiplerinin Google'da aradığı
// ifadeler üzerine kurulu (QR menü, masadan sipariş/ödeme, adisyon, hesap
// bölüşme). Başlık ~60, açıklama ~155 karakteri geçmez ki kesilmesin.
const SEO_TITLE = "QR Menü, Masadan Sipariş ve Ödeme Sistemi | Üleş";
const SEO_DESCRIPTION =
  "Restoran ve kafeler için QR menü, masadan sipariş, hesap bölüşme ve iyzico ile güvenli ödeme. Mutfak ekranı, adisyon ve gün sonu tek panelde. Ücretsiz demo.";

export const metadata: Metadata = {
  // absolute: kök yerleşimdeki "%s · Üleş" şablonu başlığı uzatmasın.
  title: { absolute: SEO_TITLE },
  description: SEO_DESCRIPTION,
  keywords: [
    "QR menü",
    "QR kod menü",
    "dijital menü",
    "restoran QR sipariş",
    "masadan sipariş",
    "masadan ödeme",
    "QR ile ödeme",
    "hesap bölüşme",
    "adisyon programı",
    "restoran sipariş sistemi",
    "kafe sipariş sistemi",
    "mutfak ekranı",
    "restoran yazılımı",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: "/",
    type: "website",
    locale: "tr_TR",
    siteName: "Üleş",
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
};

/*
 * Renkler. Koyu bölümler yclgames.com'un gece laciverti zeminini, açık
 * bölümler getmidas.com'un açık gri/beyaz dönüşümünü izler; ikisi de marka
 * lacivertine (#1D126D) göre tonlandı. Koyu zeminde marka lacivertı
 * görünmediği için orada daha parlak bir ton (ACCENT) kullanılıyor.
 */
const INK = "#08061A"; // koyu bölüm zemini
const INK_CARD = "#0F0B2E"; // koyu zemindeki kart
const BRAND = "#1D126D";
const ACCENT = "#7C6CFF";
const WARM = "#FFC857"; // küçük vurgular (etiket noktası, yıldız)
const ON_DARK = "#F4F3FF";
const ON_DARK_MUTED = "rgba(244,243,255,0.62)";
const SOFT = "#F3F2FA"; // açık bölüm zemini
const MUTED = "#5B5B72";
const LINE = "#E7E5F4";

const displayFont = { fontFamily: "var(--font-display)" } as const;
const monoFont = { fontFamily: "var(--font-mono)" } as const;

const featureRows = [
  {
    id: "qr-siparis",
    tag: "01 — QR Menü ve Sipariş",
    title: "QR menü masada, sipariş tek dokunuşta.",
    desc: "Müşteri masadaki QR'ı okutur; uygulama indirmeden menüyü görür, sepetini toplar ve tek seferde gönderir. Yanlışlıkla dokunulan ürün mutfağa gitmez.",
    points: [
      "Sepet, adet ve ürüne not (\"acısız\", \"az pişmiş\")",
      "Ürün fotoğrafı, açıklama ve alerjen bilgisi",
      "Telefonun diline göre otomatik çok dilli menü",
    ],
    visual: "menu" as const,
  },
  {
    id: "hesap-bolusme",
    tag: "02 — Hesap Bölüşme ve Masadan Ödeme",
    title: "Hesabı herkes kendi payına göre, masadan öder.",
    desc: "Eşit bölün, herkes yediğini seçsin ya da istediği tutarı girsin. Kalan tutar canlı güncellenir; aynı kalemi iki kişi ödeyemez.",
    points: [
      "Eşit böl, kalem seç veya tutar gir",
      "Bahşiş ayrı satır — ciroya karışmaz",
      "Hesap kapanınca dijital fiş e-postayla",
    ],
    visual: "payment" as const,
  },
  {
    id: "mutfak",
    tag: "03 — Mutfak ve Bar Ekranı",
    title: "Sipariş mutfağa anında, sesli uyarıyla.",
    desc: "Yeni sipariş geldiğinde mutfak ekranı ses çıkarır; masa adı, bekleme süresi ve notlarla listelenir. Hazır olan kalem tek dokunuşla düşer.",
    points: [
      "Garson ve müşteri siparişi aynı hesapta",
      "Bekleme süresi ile önceliklendirme",
      "Ek donanım yok — tablet ya da ekran yeterli",
    ],
    visual: "kitchen" as const,
  },
];

const moreFeatures = [
  {
    icon: CodeIcon,
    title: "Kendi sitenize gömün",
    desc: "Menünüz tek satır kodla web sitenizde. Siteniz yoksa paylaşılabilir menü linkinizi Instagram'a koyun.",
  },
  {
    icon: ImageIcon,
    title: "Görsel ve çok dilli menü",
    desc: "Telefonla çektiğiniz fotoğrafı yükleyin; İngilizce, Almanca, Arapça ve daha fazlası.",
  },
  {
    icon: ReceiptIcon,
    title: "Gün sonu raporu",
    desc: "Nakit, POS, QR ile kart ve bahşiş ayrı ayrı; sayılan kasa ile fark otomatik hesaplanır.",
  },
  {
    icon: ClipboardIcon,
    title: "Personel hesap verebilirliği",
    desc: "Kim ekledi, kim sildi, kim nakit aldı — her işlem kayıt altında, personel bazlı performans.",
  },
  {
    icon: BellIcon,
    title: "Düşük puana anında uyarı",
    desc: "Memnun müşteri Google yorumuna yönlenir; düşük puan gelince müdür, müşteri daha masadayken haberdar olur.",
  },
  {
    icon: BuildingIcon,
    title: "Çoklu şube",
    desc: "Her şubenin menüsü, masaları ve personeli ayrı; zincir işletmeler tek yerden yönetir.",
  },
];

const trust = [
  {
    icon: ShieldIcon,
    title: "PCI-DSS altyapı",
    desc: "Kart bilgisi iyzico'nun sertifikalı ödeme formuna girilir; bizim ya da işletmenin sunucusuna hiç uğramaz.",
  },
  {
    icon: CardIcon,
    title: "3D Secure",
    desc: "Her kartlı ödeme bankanın doğrulamasından geçer.",
  },
  {
    icon: WalletIcon,
    title: "Para doğrudan işletmeye",
    desc: "Tahsilat iyzico üzerinden işletmenin kendi hesabına yatar; para Üleş'ten geçmez.",
  },
  {
    icon: ClipboardIcon,
    title: "KVKK kayıtları",
    desc: "Girişler, iptaller ve ayar değişiklikleri silinemez erişim kaydında tutulur.",
  },
];

const steps = [
  {
    n: "01",
    title: "QR'ı okutun",
    desc: "Masadaki kod menüyü doğrudan açar. Uygulama indirmek, üye olmak yok.",
  },
  {
    n: "02",
    title: "Sipariş verin, hesabı izleyin",
    desc: "Müşteri isterse kendi sipariş verir, isterse garsonun girdiği hesabı canlı takip eder.",
  },
  {
    n: "03",
    title: "Bölüşün ve ödeyin",
    desc: "Herkes payını öder, hesap kendiliğinden kapanır, fiş e-postaya gelir.",
  },
];

const faqs = [
  {
    q: "Müşterinin uygulama indirmesi gerekiyor mu?",
    a: "Hayır. QR kod telefonun kamerasıyla okutulur ve menü doğrudan tarayıcıda açılır; üyelik de gerekmez.",
  },
  {
    q: "Kartlı ödemeyi hemen açmak zorunda mıyım?",
    a: "Hayır. Pek çok işletme QR'ı önce menü ve hesap görüntüleme için kullanır; müşteri payını görür, ödemeyi personele yapar. Kartlı ödemeyi hazır olduğunuzda ayarlardan açarsınız.",
  },
  {
    q: "Para kimin hesabına yatıyor?",
    a: "Doğrudan sizin. Kartlı tahsilat iyzico'nun lisanslı altyapısıyla işletmenin kendi hesabına yapılır; Üleş bir ödeme kuruluşu değildir ve para Üleş'ten geçmez.",
  },
  {
    q: "Garsonlar sistemi kullanabilecek mi?",
    a: "Evet. Garson ekranında kategori ve arama ile ürün tek dokunuşla eklenir; nakit ve POS ödemeleri de aynı hesaba işlenir. Müşteri siparişi ve garson siparişi aynı hesapta birleşir.",
  },
  {
    q: "Mevcut POS / kasa sistemimle çalışır mı?",
    a: "Ödeme ve hesap kapanma olayları kasa sisteminize bildirim (webhook) olarak gönderilebilir. POS cihazından alınan kartlı ödemeleri de sisteme kaydedebilirsiniz.",
  },
  {
    q: "Kurulum ne kadar sürer?",
    a: "Menünüzü ve masalarınızı birlikte giriyoruz, QR kodlarınız hazır çıkıyor. Kurulum ve personel eğitimi bizden.",
  },
];

/** Koyu ya da açık zeminde küçük, harf aralıklı bölüm etiketi. */
function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className="inline-flex items-center gap-2 text-[11px] uppercase"
      style={{
        ...monoFont,
        letterSpacing: "0.22em",
        color: dark ? ON_DARK_MUTED : MUTED,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dark ? WARM : ACCENT }} />
      {children}
    </p>
  );
}

function Check({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
      style={{
        background: dark ? "rgba(124,108,255,0.2)" : "rgba(29,18,109,0.08)",
        color: dark ? "#A99BFF" : BRAND,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Koyu zeminde iyzico logolarının okunması için beyaz kapsül. */
function PaymentLogos({ className = "h-4" }: { className?: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white px-4 py-2">
      {/* iyzico'nun resmi logo paketindeki gerçek marka varlığı. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/payment-logos.svg"
        alt="iyzico ile Öde — Mastercard, Visa, American Express, Troy"
        className={`${className} w-auto`}
      />
    </span>
  );
}

function FeatureVisual({ kind }: { kind: "menu" | "payment" | "kitchen" }) {
  return (
    <div
      className="relative overflow-hidden rounded-[32px] px-6 py-10 sm:px-10 sm:py-14"
      style={{
        background:
          kind === "kitchen"
            ? `radial-gradient(80% 70% at 70% 20%, rgba(124,108,255,0.35), transparent 70%), ${INK}`
            : `radial-gradient(90% 80% at 80% 0%, rgba(124,108,255,0.22), transparent 65%), #ffffff`,
        border: `1px solid ${kind === "kitchen" ? "rgba(255,255,255,0.06)" : LINE}`,
      }}
    >
      {kind === "menu" && (
        <HeroMockup className="mx-auto w-full max-w-[250px]" />
      )}
      {kind === "payment" && (
        <PaymentMockup className="mx-auto w-full max-w-[250px]" />
      )}
      {kind === "kitchen" && <KitchenMockup className="mx-auto max-w-sm" />}
    </div>
  );
}

// Canlı önizlemede gösterilen gerçek menü sayfası. Prod'da kalıcı bir demo
// şubeye işaret etmeli; env tanımlı değilse geliştirme ortamındaki seed'e düşer.
const DEMO_MENU_SLUG = process.env.DEMO_MENU_SLUG || "ana-sube-deneme";

// Google için yapılandırılmış veri. FAQPage, SSS bölümündeki soruların arama
// sonucunda açılır şekilde görünmesini sağlayabilir; metinler sayfadakiyle aynı
// olmalı (Google görünmeyen içerik için yapılandırılmış veriyi yok sayar).
function buildJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Üleş",
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        email: "destek@xn--le-wka21b.com",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "destek@xn--le-wka21b.com",
          ...(siteContent.phone && { telephone: siteContent.phone }),
          availableLanguage: ["Turkish"],
        },
        ...(siteContent.phone && { telephone: siteContent.phone }),
        ...(hasAddress() && {
          address: {
            "@type": "PostalAddress",
            streetAddress: siteContent.address.street,
            addressLocality: siteContent.address.district || siteContent.address.city,
            addressRegion: siteContent.address.city,
            postalCode: siteContent.address.postalCode || undefined,
            addressCountry: "TR",
          },
        }),
        ...(siteContent.mapsUrl && { hasMap: siteContent.mapsUrl }),
        ...(() => {
          const sameAs = Object.values(siteContent.social).filter(Boolean);
          return sameAs.length ? { sameAs } : {};
        })(),
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Üleş",
        inLanguage: "tr-TR",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: "Üleş — QR menü, sipariş ve ödeme sistemi",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, iOS, Android",
        description: SEO_DESCRIPTION,
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          description: "Ücretsiz deneme süresi, kurulum ve eğitim dahil",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

export default function Home() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");
  const jsonLd = buildJsonLd(siteUrl);
  return (
    <div
      className="min-h-screen overflow-x-clip"
      style={{
        backgroundColor: "#ffffff",
        color: INK,
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      <CleanHashLinks />
      {/* Arama motorlarına ürünü tanıtan yapılandırılmış veri */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <SiteHeader home />

      <main>
        {/* ─── Hero (koyu) ────────────────────────────────────────── */}
        <section
          className="relative -mt-[69px] overflow-hidden pt-[69px]"
          style={{
            background: `radial-gradient(60% 70% at 85% 5%, rgba(124,108,255,0.38), transparent 65%), radial-gradient(55% 60% at 0% 100%, rgba(29,18,109,0.95), transparent 70%), ${INK}`,
            color: ON_DARK,
          }}
        >
          {/* İnce ızgara dokusu — kenarlara doğru kaybolur */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(70% 60% at 50% 40%, #000 30%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(70% 60% at 50% 40%, #000 30%, transparent 80%)",
            }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
            <div className="ules-rise text-center lg:text-left">
              <h1
                className="text-[44px] leading-[1.02] sm:text-6xl lg:text-[70px]"
                style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.035em" }}
              >
                {/* Aranan ifade (QR menü, sipariş, ödeme) başlığın görünür ilk
                    satırı — gizli anahtar kelime değil. */}
                <span
                  className="mb-6 flex items-center justify-center gap-2 text-[10px] uppercase leading-relaxed tracking-[0.16em] sm:text-[11px] sm:tracking-[0.22em] lg:justify-start"
                  style={{ ...monoFont, fontWeight: 500, color: ON_DARK_MUTED }}
                >
                  {/* Nokta telefonda gizli: satır ikiye bölününce metinden kopup yalnız kalıyordu. */}
                  <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full sm:inline-block" style={{ background: WARM }} aria-hidden="true" />
                  Restoran ve kafeler için QR menü, sipariş ve ödeme sistemi
                </span>
                Masada sipariş.
                <br />
                Hesabı bölüş.
                <br />
                <span
                  style={{
                    background: `linear-gradient(90deg, #B9AEFF, ${WARM})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Öde.
                </span>
              </h1>
              <p
                className="mx-auto mt-6 max-w-xl text-lg leading-relaxed lg:mx-0"
                style={{ color: ON_DARK_MUTED }}
              >
                Menünüz QR&apos;a taşınır, sipariş mutfağa anında düşer, hesap
                eşit ya da kalem kalem bölünür — ödeme iyzico güvencesiyle
                doğrudan işletmenize.
              </p>
              <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                <a
                  href="#iletisim"
                  className="rounded-full px-7 py-4 text-center font-semibold transition-transform hover:scale-[1.04]"
                  style={{ background: ON_DARK, color: INK }}
                >
                  Ücretsiz demo isteyin
                </a>
                <a
                  href="#nasil-calisir"
                  className="rounded-full px-7 py-4 text-center font-semibold transition-colors hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  Nasıl çalışır?
                </a>
              </div>
              <ul
                className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm lg:justify-start"
                style={{ color: ON_DARK_MUTED }}
              >
                {["Uygulama indirmek yok", "Kart bilgisi bize uğramaz", "Kurulum bizden"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-2">
                      <Check dark />
                      {t}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Telefonlar + çevresinde süzülen bildirim kartları */}
            <div className="relative mx-auto h-[460px] w-full max-w-[520px] sm:h-[560px]">
              <div
                aria-hidden="true"
                className="absolute inset-[-10%]"
                // Bulanıklık filtresi (blur-3xl) yerine radyal gradyan: aynı
                // görünüm, ama telefonda kaydırırken her karede yeniden hesaplanmıyor.
                style={{ background: "radial-gradient(closest-side, rgba(124,108,255,0.38), transparent)" }}
              />
              <HeroMockup className="absolute left-[4%] top-10 w-[52%] -rotate-[7deg] sm:top-14" />
              <PaymentMockup className="absolute right-[4%] top-0 w-[52%] rotate-[6deg]" />

              <div
                className="ules-float absolute -left-1 top-6 w-[210px] rounded-2xl p-3.5 shadow-2xl sm:-left-6 sm:w-[230px]"
                style={{
                  ["--ules-rot" as string]: "-3deg",
                  background: "rgba(255,255,255,0.96)",
                  color: INK,
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"
                    style={{ background: BRAND }}
                  >
                    <BellIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold">Yeni sipariş · Masa 4</p>
                    <p className="text-xs" style={{ color: MUTED }}>
                      2× Izgara Köfte, 1× Ayran
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="ules-float-slow absolute -right-1 bottom-10 w-[220px] rounded-2xl p-3.5 shadow-2xl sm:-right-6 sm:w-[240px]"
                style={{
                  ["--ules-rot" as string]: "3deg",
                  background: "rgba(255,255,255,0.96)",
                  color: INK,
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                    style={{ background: "#E7F8EE", color: "#15803d" }}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold">₺270,00 ödendi</p>
                    <p className="text-xs" style={{ color: MUTED }}>
                      3 kişi · eşit bölüşüldü
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="ules-float absolute bottom-24 left-[2%] hidden items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold shadow-xl sm:inline-flex"
                style={{ background: WARM, color: INK, animationDelay: "-3s" }}
              >
                <QrIcon className="h-4 w-4" />
                QR ile açıldı
              </div>
            </div>
          </div>

          {/* Hero ile açık bölüm arasındaki güven şeridi */}
          <div
            className="relative"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
              <p className="text-sm" style={{ color: ON_DARK_MUTED }}>
                Kartlı ödemeler iyzico&apos;nun lisanslı altyapısıyla, doğrudan
                işletmenin hesabına.
              </p>
              <PaymentLogos />
            </div>
          </div>
        </section>

        {/* ─── Özellik satırları (açık gri, Midas düzeni) ────────── */}
        <section id="ozellikler" className="scroll-mt-20" style={{ background: SOFT }}>
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>Özellikler</Eyebrow>
              <h2
                className="mt-5 text-4xl leading-[1.08] sm:text-5xl"
                style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
              >
                Masadan mutfağa, siparişten ödemeye tek akış.
              </h2>
              <p className="mt-5 text-lg" style={{ color: MUTED }}>
                Demo değil — anlattığımız her şey bugün çalışan üründe var.
              </p>
            </div>

            <div className="mt-20 space-y-24 sm:space-y-32">
              {featureRows.map((row, i) => (
                <div
                  key={row.id}
                  className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20"
                >
                  <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                    <Eyebrow>{row.tag}</Eyebrow>
                    <h3
                      className="mt-4 text-3xl leading-tight sm:text-[40px]"
                      style={{ ...displayFont, fontWeight: 700, letterSpacing: "-0.025em" }}
                    >
                      {row.title}
                    </h3>
                    <p className="mt-5 text-lg leading-relaxed" style={{ color: MUTED }}>
                      {row.desc}
                    </p>
                    <ul className="mt-7 space-y-3.5">
                      {row.points.map((p) => (
                        <li key={p} className="flex gap-3">
                          <Check />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                    <FeatureVisual kind={row.visual} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Diğer özellikler (beyaz, kart ızgarası) ───────────── */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-xl">
                <Eyebrow>Ve dahası</Eyebrow>
                <h2
                  className="mt-5 text-4xl leading-[1.08] sm:text-5xl"
                  style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
                >
                  Adisyon, kasa ve raporlar da hazır.
                </h2>
              </div>
              <p className="max-w-sm" style={{ color: MUTED }}>
                Kasa, personel, rapor ve menü yönetimi aynı panelde; ek yazılım
                ya da donanım gerekmez.
              </p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moreFeatures.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{ background: SOFT, border: `1px solid ${LINE}` }}
                >
                  <span
                    className="grid h-12 w-12 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110"
                    style={{ background: BRAND }}
                  >
                    <f.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-6 text-lg font-semibold">{f.title}</p>
                  <p className="mt-2 leading-relaxed" style={{ color: MUTED }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Paneller (örnek ekranlar) ─────────────────────────── */}
        <section id="paneller" className="scroll-mt-20" style={{ background: SOFT }}>
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Eyebrow>Paneller</Eyebrow>
              <h2
                className="mt-5 text-4xl leading-[1.08] sm:text-5xl"
                style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
              >
                Kasa, garson ve mutfak ekranları hazır.
              </h2>
              <p className="mt-5 text-lg" style={{ color: MUTED }}>
                Ek donanım yok: tablet, telefon ya da bilgisayardan açılır. Her
                personel yalnızca kendi işine ait ekranı görür.
              </p>
            </div>
            <PanelShowcase />
          </div>
        </section>

        {/* ─── Güvenlik (koyu, Midas'ın siyah bandı) ─────────────── */}
        <section
          id="guvenlik"
          className="relative scroll-mt-20 overflow-hidden"
          style={{
            background: `radial-gradient(50% 60% at 100% 0%, rgba(124,108,255,0.28), transparent 70%), ${INK}`,
            color: ON_DARK,
          }}
        >
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <div>
                <Eyebrow dark>Güvenlik</Eyebrow>
                <h2
                  className="mt-5 text-4xl leading-[1.08] sm:text-5xl"
                  style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
                >
                  Para doğrudan size. Kart bilgisi hiç bize uğramaz.
                </h2>
                <p className="mt-6 text-lg leading-relaxed" style={{ color: ON_DARK_MUTED }}>
                  Üleş bir ödeme kuruluşu değildir. Müşteri kartını iyzico&apos;nun
                  güvenli ödeme formuna girer, tahsilat işletmenin kendi
                  hesabına yapılır.
                </p>
                <div className="mt-8">
                  <PaymentLogos className="h-5" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {trust.map((t) => (
                  <div
                    key={t.title}
                    className="rounded-3xl p-7"
                    style={{
                      background: INK_CARD,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span
                      className="grid h-11 w-11 place-items-center rounded-2xl"
                      style={{ background: "rgba(124,108,255,0.16)", color: "#B9AEFF" }}
                    >
                      <t.icon className="h-5 w-5" />
                    </span>
                    <p className="mt-5 text-lg font-semibold">{t.title}</p>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: ON_DARK_MUTED }}>
                      {t.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Canlı önizleme ─────────────────────────────────────── */}
        <section style={{ background: SOFT }}>
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <Eyebrow>Canlı önizleme</Eyebrow>
              <h2
                className="mt-5 text-4xl leading-[1.08] sm:text-5xl"
                style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
              >
                Uydurma değil, gerçek ürün.
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed lg:mx-0" style={{ color: MUTED }}>
                Yandaki telefon bir görsel değil; sistemin şu an çalışan menü
                sayfası. Kaydırıp gezebilirsiniz — müşterileriniz de tam
                olarak bunu görecek.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <a
                  href={`/menu/${DEMO_MENU_SLUG}`}
                  target="_blank"
                  rel="noopener"
                  className="rounded-full px-6 py-3.5 font-semibold text-white transition-transform hover:scale-[1.04]"
                  style={{ background: BRAND }}
                >
                  Menüyü tam ekran aç
                </a>
              </div>
            </div>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-[-5%]"
                style={{ background: "radial-gradient(closest-side, rgba(124,108,255,0.3), transparent)" }}
              />
              <LivePreviewFrame src={`/menu/${DEMO_MENU_SLUG}`} className="relative" />
            </div>
          </div>
        </section>

        {/* ─── Nasıl çalışır ──────────────────────────────────────── */}
        <section id="nasil-calisir" className="scroll-mt-20 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>Nasıl çalışır</Eyebrow>
              <h2
                className="mt-5 text-4xl leading-[1.08] sm:text-5xl"
                style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
              >
                Müşteri için üç adım.
              </h2>
            </div>
            <ol className="mt-16 grid gap-4 md:grid-cols-3">
              {steps.map((s, i) => (
                <li
                  key={s.n}
                  className="relative overflow-hidden rounded-3xl p-8"
                  style={{
                    background: i === 2 ? INK : SOFT,
                    color: i === 2 ? ON_DARK : INK,
                    border: `1px solid ${i === 2 ? "rgba(255,255,255,0.06)" : LINE}`,
                  }}
                >
                  <span
                    className="block text-7xl leading-none"
                    style={{
                      ...displayFont,
                      fontWeight: 800,
                      letterSpacing: "-0.04em",
                      color: "transparent",
                      WebkitTextStroke: `1.5px ${i === 2 ? "rgba(185,174,255,0.8)" : "rgba(29,18,109,0.35)"}`,
                    }}
                  >
                    {s.n}
                  </span>
                  <p className="mt-10 text-xl font-semibold">{s.title}</p>
                  <p
                    className="mt-2 leading-relaxed"
                    style={{ color: i === 2 ? ON_DARK_MUTED : MUTED }}
                  >
                    {s.desc}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { icon: QrIcon, text: "Her masaya özel QR, panelden tek tıkla" },
                { icon: SplitIcon, text: "Garson siparişi ve müşteri siparişi aynı hesapta" },
                { icon: ReceiptIcon, text: "Fiş e-postayla, gün sonu raporu otomatik" },
              ].map((x) => (
                <div
                  key={x.text}
                  className="flex items-center gap-3 rounded-2xl px-5 py-4 text-sm"
                  style={{ border: `1px solid ${LINE}`, color: MUTED }}
                >
                  <x.icon className="h-5 w-5 shrink-0 text-[#1D126D]" />
                  {x.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Müşteri yorumları — yalnızca gerçek yorum girilince (content/site.ts) */}
        {siteContent.testimonials.length > 0 && (
          <section id="yorumlar" className="scroll-mt-20 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
              <div className="mx-auto max-w-2xl text-center">
                <Eyebrow>Müşterilerimiz</Eyebrow>
                <h2
                  className="mt-5 text-4xl leading-[1.08] sm:text-5xl"
                  style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
                >
                  İşletmeler ne diyor?
                </h2>
              </div>
              <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {siteContent.testimonials.map((t) => (
                  <figure
                    key={t.name}
                    className="rounded-3xl p-7"
                    style={{ background: SOFT, border: `1px solid ${LINE}` }}
                  >
                    <blockquote className="text-lg leading-relaxed">“{t.quote}”</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      {t.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.photo} alt={t.name} loading="lazy" className="h-11 w-11 rounded-full object-cover" />
                      )}
                      <span>
                        <span className="block font-semibold">{t.name}</span>
                        <span className="block text-sm" style={{ color: MUTED }}>{t.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Ekip — yalnızca gerçek fotoğraflar girilince */}
        {siteContent.team.length > 0 && (
          <section id="ekip" className="scroll-mt-20 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
              <div className="mx-auto max-w-2xl text-center">
                <Eyebrow>Ekip</Eyebrow>
                <h2
                  className="mt-5 text-4xl leading-[1.08] sm:text-5xl"
                  style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
                >
                  Kurulumu da desteği de biz yapıyoruz.
                </h2>
              </div>
              <div className="mt-14 flex flex-wrap justify-center gap-8">
                {siteContent.team.map((m) => (
                  <div key={m.name} className="w-44 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.photo} alt={`${m.name}, ${m.role}`} loading="lazy" className="mx-auto h-36 w-36 rounded-3xl object-cover" />
                    <p className="mt-4 font-semibold">{m.name}</p>
                    <p className="text-sm" style={{ color: MUTED }}>{m.role}</p>
                    {m.linkedin && (
                      <a href={m.linkedin} target="_blank" rel="noopener" className="mt-1 inline-block text-sm underline" style={{ color: BRAND }}>
                        LinkedIn
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── SSS ────────────────────────────────────────────────── */}
        <section id="sss" className="scroll-mt-20" style={{ background: SOFT }}>
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Eyebrow>SSS</Eyebrow>
              <h2
                className="mt-5 text-4xl leading-[1.08] sm:text-5xl"
                style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
              >
                Aklınıza takılanlar.
              </h2>
              <p className="mt-5 text-lg" style={{ color: MUTED }}>
                Cevabını bulamadığınız bir soru mu var?{" "}
                <a href="#iletisim" className="font-semibold underline underline-offset-4" style={{ color: BRAND }}>
                  Bize yazın
                </a>
                .
              </p>
            </div>
            <Faq items={faqs} />
          </div>
        </section>

        {/* ─── İletişim (koyu kapanış) ────────────────────────────── */}
        <section
          id="iletisim"
          className="relative scroll-mt-20 overflow-hidden"
          style={{
            background: `radial-gradient(60% 70% at 15% 20%, rgba(124,108,255,0.35), transparent 65%), radial-gradient(50% 60% at 100% 100%, rgba(255,200,87,0.12), transparent 70%), ${INK}`,
            color: ON_DARK,
          }}
        >
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2">
            <div>
              <Eyebrow dark>Demo isteyin</Eyebrow>
              <h2
                className="mt-5 text-4xl leading-[1.05] sm:text-6xl"
                style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.035em" }}
              >
                İşletmenizi Üleş&apos;e taşıyalım.
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed" style={{ color: ON_DARK_MUTED }}>
                İlk işletmelerimizle birlikte büyüyoruz. Formu doldurun, sizi
                arayıp menünüzü birlikte kuralım.
              </p>
              <ul className="mt-8 space-y-3.5">
                {[
                  "Kurulum ve personel eğitimi bizden",
                  "Ücretsiz deneme süresi",
                  "Kartlı ödeme olmadan da başlayabilirsiniz",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check dark />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-10 text-sm" style={{ color: ON_DARK_MUTED }}>
                Form yerine e-posta mı tercih edersiniz?
              </p>
              <a
                href={PUBLIC_SUPPORT_MAILTO}
                className="mt-1 inline-block text-lg font-semibold underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
              >
                {PUBLIC_SUPPORT_EMAIL}
              </a>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <SiteFooter home />
      <MobileStickyCta home />
    </div>
  );
}
