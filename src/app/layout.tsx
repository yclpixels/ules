import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Prod'da NEXT_PUBLIC_APP_URL tanımlı olmalı — OG görselleri ve sitemap/robots
// mutlak URL üretirken buna düşer (bkz. .env.example).
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
