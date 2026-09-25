import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import MobileNav from "@/components/marketing/MobileNav";
import HeroMockup from "@/components/marketing/HeroMockup";
import PaymentMockup from "@/components/marketing/PaymentMockup";
import LivePreviewFrame from "@/components/marketing/LivePreviewFrame";
import Logo from "@/components/Logo";
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
} from "@/components/icons";

// Sadece tanıtım sayfasında kullanılan fontlar — admin panelini etkilememesi
// için burada, dosya bazında yükleniyor (next/font kuralı). yclgames.com'un
// kendi font çiftinden esinlenildi: Archivo (kalın, geniş başlıklar),
// IBM Plex Sans (gövde metni), IBM Plex Mono (küçük, aralıklı etiketler).
const display = Archivo({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono",
});

// Uygulamanın geri kalanı (admin/masa/fiş) arama motorlarına kapalı
// (bkz. layout.tsx); tanıtım sitesi bilerek açık — bulunmak istenen sayfa bu.
export const metadata: Metadata = {
  title: "Üleş — Masada QR ile Sipariş, Hesap Bölüşme ve Ödeme",
  description:
    "Üleş; restoran ve kafeler için QR'dan sipariş, hesabı bölüşme ve iyzico güvenceli ödemeyi tek sistemde toplar. Menünüzü kendi sitenize gömün, mutfağa anlık sipariş düşürün.",
  robots: { index: true, follow: true },
};

const features = [
  {
    icon: QrIcon,
    title: "QR Sipariş",
    desc: "Müşteri masadaki QR'ı okutur, menüyü görür, sepetini toplar ve tek dokunuşla gönderir — yanlışlıkla dokunma mutfağa gitmez.",
  },
  {
    icon: SplitIcon,
    title: "Hesap Bölüşme",
    desc: "Eşit böl, kalem kalem seç ya da istediği tutarı gir. Fazlası otomatik bahşiş sayılır, kimse eksik öder.",
  },
  {
    icon: ShieldIcon,
    title: "Güvenli Ödeme",
    desc: "Kart bilgisi hiçbir zaman bize uğramaz; müşteri iyzico'nun PCI-DSS uyumlu arayüzünden öder.",
  },
  {
    icon: BellIcon,
    title: "Mutfak Ekranı",
    desc: "Yeni sipariş geldiğinde sesli uyarı verir — mutfağın ekrana bakmasını beklemez, masa ve bekleme süresiyle listelenir.",
  },
  {
    icon: ImageIcon,
    title: "Görsel & Çoklu Dil Menü",
    desc: "Ürün fotoğrafı, açıklama, alerjen bilgisi; İngilizce dahil birden çok dilde menü sunun.",
  },
  {
    icon: CodeIcon,
    title: "Kendi Sitenize Gömün",
    desc: "Menünüzü tek satır kodla kendi web sitenize ekleyin, ayrıca paylaşılabilir bir menü linki de olsun.",
  },
  {
    icon: BuildingIcon,
    title: "Çoklu Şube Yönetimi",
    desc: "Zincir işletmeler tek panelden tüm şubeleri, personeli ve abonelik durumunu yönetir.",
  },
  {
    icon: ClipboardIcon,
    title: "Personel Hesap Verebilirliği",
    desc: "Kim ekledi, kim sildi, kim nakit aldı — her işlem kayıt altında, gün sonu raporu otomatik çıkar.",
  },
];

const steps = [
  {
    n: "1",
    title: "QR'ı okutun",
    desc: "Masadaki kod menüyü doğrudan açar, uygulama indirmeye gerek yok.",
  },
  {
    n: "2",
    title: "Sipariş verin ya da hesabı takip edin",
    desc: "Müşteri dilerse kendi sipariş verir, dilerse sadece hesabını canlı izler.",
  },
  {
    n: "3",
    title: "Ödeyin",
    desc: "Kartla öder, hesap kapanır, dijital fiş e-posta ile gönderilir.",
  },
];

// Canlı önizlemede gösterilen gerçek menü sayfası. Prod'da kalıcı bir demo
// şubeye işaret etmeli; env tanımlı değilse geliştirme ortamındaki seed'e düşer.
const DEMO_MENU_SLUG = process.env.DEMO_MENU_SLUG || "ana-sube-deneme";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Üleş",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Restoran ve kafeler için QR'dan sipariş, hesap bölüşme ve iyzico güvenceli ödeme.",
  offers: {
    "@type": "Offer",
    availability: "https://schema.org/InStock",
  },
};

export default function Home() {
  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen`}
      style={{
        backgroundColor: "#ffffff",
        color: "#0a0a0a",
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      {/* Arama motorlarına ürünü tanıtan yapılandırılmış veri */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{
          backgroundColor: "rgba(255,255,255,0.85)",
          borderBottom: "1px solid #eeeeee",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Logo className="w-8 h-8 shrink-0" />
            <span
              className="text-xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
            >
              Üleş
            </span>
          </span>
          <nav
            className="hidden sm:flex items-center gap-8 text-sm"
            style={{ color: "#6b7280" }}
          >
            <a href="#ozellikler" className="transition-colors hover:text-black">
              Özellikler
            </a>
            <a href="#nasil-calisir" className="transition-colors hover:text-black">
              Nasıl Çalışır
            </a>
            <a href="#iletisim" className="transition-colors hover:text-black">
              İletişim
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/login"
              className="hidden sm:inline-block text-sm rounded-lg px-3 py-1.5 transition-colors hover:bg-[#fafafa]"
              style={{ border: "1px solid #e5e7eb" }}
            >
              Personel Girişi
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="relative max-w-2xl mx-auto px-4 pt-20 sm:pt-28 text-center">
            <span
              className="inline-flex items-center gap-1.5 text-xs uppercase rounded-full px-3 py-1 mb-6"
              style={{
                color: "#6b7280",
                border: "1px solid #e5e7eb",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
              }}
            >
              <ShieldIcon className="w-3.5 h-3.5 text-[#E0233A]" />
              iyzico ile PCI-DSS uyumlu güvenli ödeme
            </span>
            <h1
              className="text-4xl sm:text-6xl leading-[1.08] tracking-tight text-balance"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
            >
              Masada QR ile sipariş verin, hesabı bölüşün, ödeyin.
            </h1>
            <p
              className="mt-6 text-lg text-balance max-w-xl mx-auto"
              style={{ color: "#6b7280" }}
            >
              Üleş; menünüzü QR&apos;a taşır, siparişi mutfağa anında
              düşürür, hesabı eşit ya da kalem kalem böler — ödeme iyzico
              güvencesiyle tamamlanır.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#iletisim"
                className="rounded-full px-7 py-3.5 font-medium text-white transition-transform hover:scale-105"
                style={{ backgroundColor: "#E0233A" }}
              >
                Demo İsteyin
              </a>
              <a
                href="#nasil-calisir"
                className="rounded-full px-7 py-3.5 font-medium transition-colors hover:bg-[#fafafa]"
                style={{ border: "1px solid #e5e7eb" }}
              >
                Nasıl Çalışır?
              </a>
            </div>
            <span
              className="mt-6 inline-flex items-center rounded-full px-4 py-2"
              style={{ border: "1px solid #eeeeee" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/payment-logos.svg"
                alt="iyzico ile Öde — Mastercard, Visa, American Express, Troy"
                className="h-4 sm:h-[18px] w-auto"
              />
            </span>
          </div>

          {/* İki telefon üst üste — menü ve ödeme ekranı tek kompozisyonda */}
          <div className="relative mx-auto mt-14 sm:mt-16 h-[380px] sm:h-[480px] max-w-xs sm:max-w-md px-4">
            <HeroMockup className="absolute left-0 top-6 sm:top-8 w-[58%] -rotate-6 drop-shadow-2xl" />
            <PaymentMockup className="absolute right-0 top-0 w-[58%] rotate-6 drop-shadow-2xl" />
          </div>
        </section>

        <section id="ozellikler" style={{ borderTop: "1px solid #eeeeee" }}>
          <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
            <h2
              className="text-3xl sm:text-4xl text-center tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
            >
              Zaten çalışan bir sistem.
            </h2>
            <p
              className="text-center mt-3 max-w-xl mx-auto"
              style={{ color: "#6b7280" }}
            >
              Demo değil — tüm bu özellikler bugün canlı kullanılıyor.
            </p>
            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <div key={f.title} className="space-y-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: "#E0233A" }}
                  >
                    <f.icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm" style={{ color: "#6b7280" }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ borderTop: "1px solid #eeeeee", backgroundColor: "#fafafa" }}>
          <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center">
            <p
              className="text-sm uppercase"
              style={{
                color: "#9ca3af",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
              }}
            >
              Ödeme altyapısı
            </p>
            <h2
              className="text-3xl sm:text-4xl mt-2 tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
            >
              Ödemeleriniz iyzico güvencesiyle
            </h2>
            <p
              className="mt-4 max-w-xl mx-auto"
              style={{ color: "#6b7280" }}
            >
              Kart bilgisi hiçbir zaman bizim ya da işletmenin sunucusuna
              uğramaz — doğrudan iyzico&apos;nun PCI-DSS sertifikalı, 3D
              Secure destekli altyapısına girilir. Tahsilat da doğrudan
              işletmenin kendi hesabına gider.
            </p>
            <div
              className="mt-12 inline-flex flex-col items-center gap-6 rounded-2xl px-6 sm:px-10 py-8"
              style={{ backgroundColor: "#ffffff", border: "1px solid #eeeeee" }}
            >
              {/* iyzico'nun resmi logo paketindeki gerçek marka varlığı —
                  docs.iyzico.com/en/add-ons/iyzico-logo-pack. Kartlı ağların
                  kendi logoları uydurulmadı, iyzico'nun sağladığı orijinal
                  görsel kullanıldı. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/payment-logos.svg"
                alt="iyzico ile Öde — Mastercard, Visa, American Express, Troy"
                className="h-7 sm:h-8 w-auto"
              />
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                <span
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "#374151" }}
                >
                  <ShieldIcon className="w-4 h-4 text-[#E0233A]" />
                  PCI-DSS
                </span>
                <span
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "#374151" }}
                >
                  <CardIcon className="w-4 h-4 text-[#E0233A]" />
                  3D Secure
                </span>
              </div>
            </div>
          </div>
        </section>

        <section style={{ borderTop: "1px solid #eeeeee" }}>
          <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28 grid sm:grid-cols-2 gap-12 items-center">
            <div className="order-2 sm:order-1 text-center sm:text-left">
              <h2
                className="text-3xl sm:text-4xl tracking-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
              >
                Uydurma değil, gerçek ürün.
              </h2>
              <p className="mt-4 text-balance" style={{ color: "#6b7280" }}>
                Yandaki telefon bir mockup değil — az önce anlattığımız
                sistemin şu an çalışan, gerçek menü ekranı. İsterseniz siz de
                kaydırıp gezebilirsiniz.
              </p>
            </div>
            <LivePreviewFrame
              src={`/menu/${DEMO_MENU_SLUG}`}
              className="order-1 sm:order-2"
            />
          </div>
        </section>

        <section
          id="nasil-calisir"
          style={{ borderTop: "1px solid #eeeeee", backgroundColor: "#fafafa" }}
        >
          <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
            <h2
              className="text-3xl sm:text-4xl text-center tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
            >
              Nasıl çalışır?
            </h2>
            <div className="mt-14 grid sm:grid-cols-2 gap-12 items-center">
              <HeroMockup className="w-full max-w-[220px] mx-auto order-2 sm:order-1" />
              <div className="space-y-8 order-1 sm:order-2">
                {steps.map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <div
                      className="w-10 h-10 shrink-0 rounded-full text-white flex items-center justify-center font-semibold"
                      style={{ backgroundColor: "#E0233A" }}
                    >
                      {s.n}
                    </div>
                    <div>
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="iletisim" style={{ borderTop: "1px solid #eeeeee" }}>
          <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
            <div className="max-w-md mx-auto">
              <h2
                className="text-3xl sm:text-4xl text-center tracking-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
              >
                İşletmenizi Üleş&apos;e taşıyalım
              </h2>
              <p className="text-center mt-3" style={{ color: "#6b7280" }}>
                İlk kullanıcılarımızla birlikte büyüyoruz — kurulum ve demo
                tamamen bizden.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #eeeeee" }}>
        <div className="max-w-5xl mx-auto px-4 py-12 grid sm:grid-cols-3 gap-8">
          <div>
            <span className="flex items-center gap-2">
              <Logo className="w-7 h-7 shrink-0" />
              <span
                className="text-lg"
                style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
              >
                Üleş
              </span>
            </span>
            <p className="text-sm mt-3 max-w-[220px]" style={{ color: "#6b7280" }}>
              Masada QR ile sipariş, hesap bölüşme ve iyzico güvenceli ödeme.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Ürün</p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "#6b7280" }}>
              <li>
                <a href="#ozellikler" className="transition-colors hover:text-black">
                  Özellikler
                </a>
              </li>
              <li>
                <a href="#nasil-calisir" className="transition-colors hover:text-black">
                  Nasıl Çalışır
                </a>
              </li>
              <li>
                <a href="#iletisim" className="transition-colors hover:text-black">
                  Demo İsteyin
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">İşletmeler</p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "#6b7280" }}>
              <li>
                <Link href="/admin/login" className="transition-colors hover:text-black">
                  Personel Girişi
                </Link>
              </li>
              <li>
                <Link href="/gizlilik" className="transition-colors hover:text-black">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/kullanim-sartlari" className="transition-colors hover:text-black">
                  Kullanım Şartları
                </Link>
              </li>
              <li>
                <Link href="/on-bilgilendirme" className="transition-colors hover:text-black">
                  Ön Bilgilendirme Formu
                </Link>
              </li>
              <li>
                <Link href="/cerez-politikasi" className="transition-colors hover:text-black">
                  Çerez Politikası
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #eeeeee" }}>
          <div
            className="max-w-5xl mx-auto px-4 py-3 text-xs"
            style={{ color: "#9ca3af" }}
          >
            Üleş bir ödeme kuruluşu veya aracı kurum değildir. Restoran ve
            kafeler için QR tabanlı sipariş, hesap bölüşme ve ödeme
            yönlendirme yazılımı sağlar; kartlı tahsilat iyzico&apos;nun
            lisanslı altyapısı üzerinden doğrudan işletmenin hesabına
            yapılır.
          </div>
        </div>
        <div style={{ borderTop: "1px solid #eeeeee" }}>
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "#6b7280" }}>
              © {new Date().getFullYear()} Üleş
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/payment-logos.svg"
              alt="iyzico ile Öde — Mastercard, Visa, American Express, Troy"
              className="h-4 w-auto"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
