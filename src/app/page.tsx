import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import MobileNav from "@/components/marketing/MobileNav";
import HeroMockup from "@/components/marketing/HeroMockup";
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

// Sadece tanıtım sayfasında kullanılan başlık fontu — admin panelini
// etkilememesi için burada, dosya bazında yükleniyor (next/font kuralı).
const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
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
    <div className={`${display.variable} min-h-screen bg-gray-50`}>
      {/* Arama motorlarına ürünü tanıtan yapılandırılmış veri */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="sticky top-0 z-30 border-b bg-white/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Logo className="w-8 h-8 shrink-0" />
            <span
              className="text-xl italic"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Üleş
            </span>
          </span>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-500">
            <a href="#ozellikler" className="transition-colors hover:text-gray-900">
              Özellikler
            </a>
            <a href="#nasil-calisir" className="transition-colors hover:text-gray-900">
              Nasıl Çalışır
            </a>
            <a href="#iletisim" className="transition-colors hover:text-gray-900">
              İletişim
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/login"
              className="hidden sm:inline-block text-sm border rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-100"
            >
              Personel Girişi
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-0 w-[520px] h-[520px] rounded-full opacity-20 blur-3xl"
            style={{ background: "linear-gradient(135deg, #fbbf24, #f87171)" }}
          />
          <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-20 sm:pt-20 sm:pb-28 grid sm:grid-cols-2 gap-10 items-center">
            <div className="text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 border rounded-full px-3 py-1 mb-4">
                <ShieldIcon className="w-3.5 h-3.5 text-amber-600" />
                iyzico ile PCI-DSS uyumlu güvenli ödeme
              </span>
              <p
                className="italic text-amber-600 text-lg mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Hoş geldiniz
              </p>
              <h1
                className="text-4xl sm:text-5xl leading-[1.1] tracking-tight text-balance"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Masada QR ile sipariş verin, hesabı bölüşün, ödeyin.
              </h1>
              <p className="mt-5 text-lg text-gray-500 text-balance">
                Üleş; menünüzü QR&apos;a taşır, siparişi mutfağa anında
                düşürür, hesabı eşit ya da kalem kalem böler — ödeme iyzico
                güvencesiyle tamamlanır.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <a
                  href="#iletisim"
                  className="rounded-lg px-6 py-3 font-medium text-white shadow-lg shadow-amber-600/20 transition-transform hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #fbbf24, #f87171)" }}
                >
                  Demo İsteyin
                </a>
                <a
                  href="#nasil-calisir"
                  className="border rounded-lg px-6 py-3 font-medium transition-colors hover:bg-gray-100"
                >
                  Nasıl Çalışır?
                </a>
              </div>
            </div>
            <HeroMockup className="w-full max-w-[260px] mx-auto sm:max-w-none" />
          </div>
        </section>

        <section id="ozellikler" className="bg-white border-y">
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
            <h2
              className="text-3xl text-center"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Zaten çalışan bir sistem.
            </h2>
            <p className="text-gray-500 text-center mt-2 max-w-xl mx-auto">
              Demo değil — tüm bu özellikler bugün canlı kullanılıyor.
            </p>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="space-y-3 p-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-600/20"
                    style={{ background: "linear-gradient(135deg, #fbbf24, #f87171)" }}
                  >
                    <f.icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20 text-center">
            <p className="text-sm text-gray-500 uppercase tracking-wide">
              Ödeme altyapısı
            </p>
            <h2
              className="text-3xl mt-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ödemeleriniz iyzico güvencesiyle
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Kart bilgisi hiçbir zaman bizim ya da işletmenin sunucusuna
              uğramaz — doğrudan iyzico&apos;nun PCI-DSS sertifikalı, 3D
              Secure destekli altyapısına girilir. Tahsilat da doğrudan
              işletmenin kendi hesabına gider.
            </p>
            <div className="mt-10 inline-flex flex-col items-center gap-6 bg-gray-50 border rounded-2xl px-6 sm:px-10 py-8">
              {/* iyzico'nun resmi logo paketindeki gerçek marka varlığı —
                  docs.iyzico.com/en/add-ons/iyzico-logo-pack. Kartlı ağların
                  kendi logoları uydurulmadı, iyzico'nun sağladığı orijinal
                  görsel kullanıldı; bu yüzden beyaz zemine oturtuluyor. */}
              <span
                className="rounded-xl px-6 py-4"
                style={{ backgroundColor: "#ffffff" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/payment-logos.svg"
                  alt="iyzico ile Öde — Mastercard, Visa, American Express, Troy"
                  className="h-7 sm:h-8 w-auto"
                />
              </span>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <ShieldIcon className="w-4 h-4 text-amber-600" />
                  PCI-DSS
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <CardIcon className="w-4 h-4 text-amber-600" />
                  3D Secure
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0f0f12] border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 grid sm:grid-cols-2 gap-10 items-center">
            <div className="order-2 sm:order-1 text-center sm:text-left">
              <h2
                className="text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Uydurma değil, gerçek ürün.
              </h2>
              <p className="mt-3 text-gray-400 text-balance">
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

        <section id="nasil-calisir" className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
          <h2
            className="text-3xl text-center"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Nasıl çalışır?
          </h2>
          <div className="mt-14 grid sm:grid-cols-3 gap-10 relative">
            <div className="hidden sm:block absolute top-6 left-[16.5%] right-[16.5%] h-px bg-gray-200" />
            {steps.map((s) => (
              <div key={s.n} className="text-center relative">
                <div
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center font-semibold mx-auto relative z-10 shadow-md shadow-amber-600/20"
                  style={{ background: "linear-gradient(135deg, #fbbf24, #f87171)" }}
                >
                  {s.n}
                </div>
                <p className="font-semibold mt-4">{s.title}</p>
                <p className="text-sm text-gray-500 mt-1.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="iletisim" className="bg-amber-50 border-y border-amber-100">
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
            <div className="max-w-md mx-auto">
              <h2
                className="text-3xl text-center"
                style={{ fontFamily: "var(--font-display)" }}
              >
                İşletmenizi Üleş&apos;e taşıyalım
              </h2>
              <p className="text-gray-500 text-center mt-2">
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

      <footer className="border-t bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12 grid sm:grid-cols-3 gap-8">
          <div>
            <span className="flex items-center gap-2">
              <Logo className="w-7 h-7 shrink-0" />
              <span
                className="text-lg italic"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Üleş
              </span>
            </span>
            <p className="text-sm text-gray-500 mt-3 max-w-[220px]">
              Masada QR ile sipariş, hesap bölüşme ve iyzico güvenceli ödeme.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Ürün</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>
                <a href="#ozellikler" className="transition-colors hover:text-gray-900">
                  Özellikler
                </a>
              </li>
              <li>
                <a href="#nasil-calisir" className="transition-colors hover:text-gray-900">
                  Nasıl Çalışır
                </a>
              </li>
              <li>
                <a href="#iletisim" className="transition-colors hover:text-gray-900">
                  Demo İsteyin
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">İşletmeler</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/admin/login" className="transition-colors hover:text-gray-900">
                  Personel Girişi
                </Link>
              </li>
              <li>
                <Link href="/gizlilik" className="transition-colors hover:text-gray-900">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/kullanim-sartlari" className="transition-colors hover:text-gray-900">
                  Kullanım Şartları
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Üleş
            </p>
            <span
              className="inline-flex items-center rounded-lg px-3 py-1.5"
              style={{ backgroundColor: "#ffffff" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/payment-logos.svg"
                alt="iyzico ile Öde — Mastercard, Visa, American Express, Troy"
                className="h-4 w-auto"
              />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
