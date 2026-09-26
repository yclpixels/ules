import Link from "next/link";
import Logo from "@/components/Logo";
import MobileNav from "@/components/marketing/MobileNav";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";
import { formattedAddress, hasAddress, siteContent, telHref } from "@/content/site";
import { APPLY_HREF, NAV_LINKS, navHref } from "@/content/nav";

/**
 * Tanıtım sitesinin ortak başlığı, alt bilgisi ve mobil sabit iletişim
 * çubuğu. Ana sayfa ve tüm alt sayfalar aynısını kullanır: tutarlı görünüm
 * + iç bağlantılar (SEO).
 *
 * `home`: ana sayfadaysa bölüm bağlantıları "#ozellikler" (adres temiz kalır,
 * bkz. CleanHashLinks), alt sayfalardaysa "/#ozellikler".
 */

const INK = "#08061A";
const ON_DARK = "#F4F3FF";
const ON_DARK_MUTED = "rgba(244,243,255,0.62)";
const monoLabel = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.22em",
  color: ON_DARK_MUTED,
} as const;

export function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header
      className="sticky top-0 z-40"
      // backdrop-blur yok: kaydırırken her karede arka planı bulanıklaştırmak
      // telefonlarda takılmaya yol açıyordu; neredeyse opak zemin yeterli.
      style={{
        backgroundColor: "rgba(8,6,26,0.94)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        color: ON_DARK,
      }}
    >
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" aria-label="Üleş — ana sayfa" className="shrink-0">
          <Logo tone="white" className="h-10 w-10" />
        </Link>
        <nav
          aria-label="Ana menü"
          className="hidden lg:flex items-center gap-7 text-sm font-medium"
          style={{ color: ON_DARK_MUTED }}
        >
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={navHref(l.href, home)} className="transition-colors hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin/login"
            className="hidden lg:inline-flex rounded-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
          >
            Personel Girişi
          </Link>
          <Link
            href={APPLY_HREF}
            className="hidden sm:inline-flex rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ background: ON_DARK, color: INK }}
          >
            Demo İsteyin
          </Link>
          <MobileNav home={home} />
        </div>
      </div>
    </header>
  );
}

function SocialIcon({ name }: { name: string }) {
  const common = { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "currentColor", "aria-hidden": true } as const;
  if (name === "instagram")
    return (
      <svg {...common}>
        <path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21.9 8.2c-.1-1.6-.4-3-1.6-4.2S17.6 2.3 16 2.2c-1.6-.1-6.4-.1-8 0-1.6.1-3 .4-4.2 1.6S2.3 6.5 2.2 8.1c-.1 1.6-.1 6.4 0 8 .1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.6.1 6.4.1 8 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.6.1-6.3 0-7.9ZM19.8 18a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4A3 3 0 0 1 5.8 18c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3A3 3 0 0 1 7.5 5.7c1.2-.5 4-.4 5.3-.4s4.1-.1 5.3.4a3 3 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3Z" />
      </svg>
    );
  if (name === "linkedin")
    return (
      <svg {...common}>
        <path d="M6.9 21H3.1V8.9h3.8V21ZM5 7.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM21 21h-3.8v-5.9c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3.1v6H9.2V8.9h3.6v1.7h.1c.5-1 1.7-2 3.6-2 3.8 0 4.5 2.5 4.5 5.8V21Z" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M17.8 3h3.1l-6.7 7.7L22 21h-6.2l-4.8-6.3L5.4 21H2.3l7.2-8.2L2 3h6.3l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
    </svg>
  );
}

const SOCIAL_LABELS: Record<string, string> = { instagram: "Instagram", linkedin: "LinkedIn", x: "X" };

export function SiteFooter({ home = false }: { home?: boolean }) {
  const social = Object.entries(siteContent.social).filter(([, url]) => url);
  const hasCases = siteContent.caseStudies.length > 0;
  const h = (href: string) => navHref(href, home);

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "Üleş",
      links: [
        { href: "/ules-nedir", label: "Üleş Nedir?" },
        { href: "/uygulama#nasil-calisir", label: "Nasıl Çalışır?" },
        { href: "/uygulama", label: "Müşteri Ekranı" },
        { href: "/etki", label: "Etkimiz" },
        { href: "/blog", label: "Blog" },
      ],
    },
    {
      title: "İşletmeler",
      links: [
        { href: h("/#ozellikler"), label: "Özellikler" },
        { href: h("/#paneller"), label: "Paneller" },
        { href: h("/#guvenlik"), label: "Güvenlik" },
        ...(hasCases ? [{ href: "/vaka-calismalari", label: "Vaka Çalışmaları" }] : []),
        { href: APPLY_HREF, label: "İşletme Başvurusu" },
        { href: "/admin/login", label: "Personel Girişi" },
      ],
    },
    {
      title: "Destek",
      links: [
        { href: "/sss", label: "Sık Sorulan Sorular" },
        { href: "/iletisim", label: "İletişim" },
      ],
    },
    {
      title: "Yasal",
      links: [
        { href: "/gizlilik-politikasi", label: "Gizlilik Politikası" },
        { href: "/kvkk", label: "KVKK Aydınlatma" },
        { href: "/kullanim-sartlari", label: "Kullanım Şartları" },
        { href: "/cerez-politikasi", label: "Çerez Politikası" },
        { href: "/iade-iptal", label: "İade ve İptal" },
        { href: "/hesap-silme", label: "Hesap Silme" },
      ],
    },
  ];

  return (
    // pb-24 (telefonda): alttaki sabit iletişim çubuğu son satırı örtmesin.
    <footer
      className="pb-24 md:pb-0"
      style={{ background: INK, color: ON_DARK, borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_2.6fr] lg:gap-16">
        <div>
          <Logo tone="white" className="h-12 w-12" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed" style={{ color: ON_DARK_MUTED }}>
            Restoran ve kafeler için QR menü, masadan sipariş, hesap bölüşme ve
            iyzico güvenceli ödeme.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            <li>
              <a href={PUBLIC_SUPPORT_MAILTO} className="transition-opacity hover:opacity-70">
                {PUBLIC_SUPPORT_EMAIL}
              </a>
            </li>
            {siteContent.phone && (
              <li>
                <a href={telHref(siteContent.phone)} className="transition-opacity hover:opacity-70">
                  {siteContent.phone}
                </a>
              </li>
            )}
            {hasAddress() && (
              <li style={{ color: ON_DARK_MUTED }}>
                <address className="not-italic leading-relaxed">{formattedAddress()}</address>
                {siteContent.mapsUrl && (
                  <a href={siteContent.mapsUrl} target="_blank" rel="noopener" className="mt-1 inline-block text-white underline underline-offset-4 transition-opacity hover:opacity-70">
                    Haritada göster
                  </a>
                )}
              </li>
            )}
          </ul>
          {social.length > 0 && (
            <ul className="mt-6 flex gap-2">
              {social.map(([key, url]) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener"
                    aria-label={SOCIAL_LABELS[key] ?? key}
                    className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-white/10"
                    style={{ border: "1px solid rgba(255,255,255,0.14)" }}
                  >
                    <SocialIcon name={key} />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={APPLY_HREF}
            className="mt-8 inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: ON_DARK, color: INK }}
          >
            İşletmeni Üleş&apos;e Kat
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[11px] uppercase" style={monoLabel}>
                {col.title}
              </p>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-block py-0.5 transition-opacity hover:opacity-70">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed sm:px-6" style={{ color: "rgba(244,243,255,0.45)" }}>
          Üleş bir ödeme kuruluşu veya aracı kurum değildir. Restoran ve kafeler
          için QR tabanlı sipariş, hesap bölüşme ve ödeme yönlendirme yazılımı
          sağlar; kartlı tahsilat iyzico&apos;nun lisanslı altyapısı üzerinden
          doğrudan işletmenin hesabına yapılır.
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <p className="text-sm" style={{ color: ON_DARK_MUTED }}>
            © {new Date().getFullYear()} Üleş
          </p>
          <span className="inline-flex items-center rounded-full bg-white px-4 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/payment-logos.svg"
              alt="iyzico ile Öde — Mastercard, Visa, American Express, Troy"
              className="h-4 w-auto"
              loading="lazy"
            />
          </span>
        </div>
      </div>
    </footer>
  );
}

/**
 * Telefonda ekranın altında sabit iletişim çubuğu. Telefon/WhatsApp
 * tanımlıysa "Ara" ve "WhatsApp", her zaman "Demo İsteyin". Masaüstünde yok
 * (orada başlıktaki düğme her zaman görünür).
 */
export function MobileStickyCta() {
  const btn = "flex-1 h-12 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform";
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{
        background: "rgba(8,6,26,0.96)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex gap-2 px-3 pt-3">
        {siteContent.phone && (
          <a href={telHref(siteContent.phone)} className={btn} style={{ border: "1px solid rgba(255,255,255,0.2)", color: ON_DARK }}>
            Ara
          </a>
        )}
        {siteContent.whatsapp && (
          <a
            href={`https://wa.me/${siteContent.whatsapp}?text=${encodeURIComponent("Merhaba, Üleş hakkında bilgi almak istiyorum.")}`}
            target="_blank"
            rel="noopener"
            className={btn}
            style={{ background: "#25D366", color: "#08061A" }}
          >
            WhatsApp
          </a>
        )}
        {!siteContent.phone && !siteContent.whatsapp && (
          <Link href="/iletisim" className={btn} style={{ border: "1px solid rgba(255,255,255,0.2)", color: ON_DARK }}>
            İletişim
          </Link>
        )}
        <Link href={APPLY_HREF} className={btn} style={{ background: ON_DARK, color: INK }}>
          Demo İsteyin
        </Link>
      </div>
    </div>
  );
}
