import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Tüm uygulama tek yazı sistemi kullanır (önceden kökte kullanılmayan Geist
// indiriliyor, panel/müşteri ekranı Arial, tanıtım sitesi Archivo+Plex idi):
// IBM Plex Sans gövde, Archivo başlık, IBM Plex Mono küçük etiketler.
// latin-ext: Türkçe karakterler (ş, ğ, İ, ı) aynı dosyadan gelsin.
const display = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["500"],
  variable: "--font-mono",
  display: "swap",
  // Sadece tanıtım sitesindeki küçük etiketlerde; diğer sayfalarda indirilmesin.
  preload: false,
});

// Prod'da NEXT_PUBLIC_APP_URL tanımlı olmalı — OG görselleri ve sitemap/robots
// mutlak URL üretirken buna düşer (bkz. .env.example).
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Arama motoru site doğrulaması (Google Search Console, Bing Webmaster,
 * Yandex Webmaster). Her biri kendi panelinde "HTML etiketi" yöntemiyle
 * verdiği kodu (content="..." içindeki değer) ister. Tanıtım sayfası build
 * sırasında önceden üretildiği için kodlar BUILD anında verilmeli — Railway'de
 * değişken olarak eklenir, Dockerfile ARG ile build'e geçer. Tanımlı
 * olmayanlar için etiket basılmaz.
 */
const verification: Metadata["verification"] = {
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  }),
  ...(process.env.YANDEX_VERIFICATION && {
    yandex: process.env.YANDEX_VERIFICATION,
  }),
  ...(process.env.BING_SITE_VERIFICATION && {
    other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION },
  }),
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  verification,
  title: { default: "Üleş", template: "%s · Üleş" },
  description: "Masadan QR ile sipariş ver, hesabı böl, öde.",
  // Masa/admin/fiş sayfaları arama motorlarına düşmesin (QR linkleri özel);
  // tanıtım sitesi ve /menu bu varsayılanı kendi metadata'sında geçersiz kılar.
  robots: { index: false, follow: false },
  openGraph: {
    siteName: "Üleş",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Tarayıcı arayüzü (mobil adres çubuğu) açık temayla uyumlu olsun
  themeColor: "#1D126D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
