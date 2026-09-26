import type { ReactNode } from "react";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import { MobileStickyCta, SiteFooter, SiteHeader } from "@/components/marketing/SiteChrome";

/** Tanıtım sitesinin mutlak adresi (yapılandırılmış veri için). */
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Tanıtım sitesinin alt sayfaları için ortak iskelet: aynı başlık/alt bilgi
 * (iç bağlantılar), sayfa işaret yolu, okunaklı metin genişliği.
 */
export default function SubPage({
  crumbs,
  title,
  intro,
  children,
}: {
  crumbs: { name: string; path: string }[];
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={crumbs} siteUrl={siteUrl()} />
        <h1
          className="mt-6 text-3xl leading-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          {title}
        </h1>
        {intro && <div className="mt-4 text-lg leading-relaxed text-gray-600">{intro}</div>}
        <div className="mt-10">{children}</div>
      </main>
      <SiteFooter />
      <MobileStickyCta />
    </div>
  );
}
