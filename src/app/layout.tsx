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

export const metadata: Metadata = {
  title: { default: "Masa QR Ödeme", template: "%s · Masa QR Ödeme" },
  description: "Masadan QR ile sipariş ver, hesabı böl, öde.",
  // Masa/admin/fiş sayfaları arama motorlarına düşmesin (QR linkleri özel)
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Tarayıcı arayüzü (mobil adres çubuğu) de koyu temayla uyumlu olsun
  themeColor: "#0f0f12",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
