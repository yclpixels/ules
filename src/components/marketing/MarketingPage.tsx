import type { ReactNode } from "react";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import { MobileStickyCta, SiteFooter, SiteHeader } from "@/components/marketing/SiteChrome";
import { siteUrl } from "@/components/marketing/SubPage";
import { INK, ON_DARK, ON_DARK_MUTED, displayFont, Eyebrow } from "@/components/marketing/ui";

/**
 * Tanıtım sitesinin geniş alt sayfaları (Üleş nedir, Uygulama, SSS, Blog,
 * İletişim, Başvuru): ana sayfadaki koyu hero'nun sade bir hâli + tam
 * genişlik bölümler. Metin ağırlıklı sayfalar (yasal) SubPage kullanır.
 */
export default function MarketingPage({
  crumbs,
  eyebrow,
  title,
  intro,
  aside,
  children,
  stickyCta = true,
}: {
  crumbs: { name: string; path: string }[];
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Başlığın sağında (masaüstü) / altında (telefon) duran görsel ya da kart. */
  aside?: ReactNode;
  children: ReactNode;
  stickyCta?: boolean;
}) {
  return (
    <div className="min-h-screen overflow-x-clip bg-white" style={{ color: INK }}>
      <SiteHeader />
      <main>
        <section
          style={{
            background: `radial-gradient(55% 80% at 90% 0%, rgba(124,108,255,0.30), transparent 65%), ${INK}`,
            color: ON_DARK,
          }}
        >
          <div
            className={`mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 ${
              aside ? "grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]" : ""
            }`}
          >
            <div>
              <Breadcrumbs items={crumbs} siteUrl={siteUrl()} dark />
              {eyebrow && (
                <div className="mt-10">
                  <Eyebrow dark>{eyebrow}</Eyebrow>
                </div>
              )}
              <h1
                className={`${eyebrow ? "mt-5" : "mt-10"} max-w-3xl text-[38px] leading-[1.05] sm:text-6xl`}
                style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.035em" }}
              >
                {title}
              </h1>
              {intro && (
                <div className="mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: ON_DARK_MUTED }}>
                  {intro}
                </div>
              )}
            </div>
            {aside && <div className="relative">{aside}</div>}
          </div>
        </section>
        {children}
      </main>
      <SiteFooter />
      {stickyCta && <MobileStickyCta />}
    </div>
  );
}
