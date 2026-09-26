import Link from "next/link";
import Logo from "@/components/Logo";
import MobileNav from "@/components/marketing/MobileNav";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";
import { formattedAddress, hasAddress, siteContent, telHref } from "@/content/site";

/**
 * Tanıtım sitesinin ortak başlığı, alt bilgisi ve mobil sabit iletişim
 * çubuğu. Ana sayfa ve alt sayfalar (gizlilik politikası, teşekkür, vaka
 * çalışmaları, 404) aynısını kullanır: tutarlı görünüm + iç bağlantılar.
 *
 * `home`: ana sayfadaysa bölüm bağlantıları "#iletisim" (adres temiz kalır,
 * bkz. CleanHashLinks), alt sayfalardaysa "/#iletisim".
 */

const INK = "#08061A";
const ON_DARK = "#F4F3FF";
const ON_DARK_MUTED = "rgba(244,243,255,0.62)";
const monoLabel = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.22em",
  color: ON_DARK_MUTED,
} as const;

export const SECTIONS = [
  { id: "ozellikler", label: "Özellikler" },
  { id: "paneller", label: "Paneller" },
  { id: "guvenlik", label: "Güvenlik" },
  { id: "nasil-calisir", label: "Nasıl Çalışır" },
  { id: "sss", label: "SSS" },
];

const sectionHref = (id: string, home: boolean) => (home ? `#${id}` : `/#${id}`);

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
          className="hidden md:flex items-center gap-8 text-sm font-medium"
          style={{ color: ON_DARK_MUTED }}
        >
          {SECTIONS.map((s) => (
            <a key={s.id} href={sectionHref(s.id, home)} className="transition-colors hover:text-white">
              {s.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin/login"
            className="hidden md:inline-flex rounded-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
          >
            Personel Girişi
          </Link>
          <a
            href={sectionHref("iletisim", home)}
            className="hidden sm:inline-flex rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.04]"
            style={{ background: ON_DARK, color: INK }}
          >
            Demo İsteyin
          </a>
          <MobileNav home={home} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ home = false }: { home?: boolean }) {
  const social = Object.entries(siteContent.social).filter(([, url]) => url);
  const socialLabel: Record<string, string> = {
    instagram: "Instagram",
    linkedin: "LinkedIn",
    x: "X (Twitter)",
  };
  const hasCases = siteContent.caseStudies.length > 0;

  return (
    // pb-24 (telefonda): alttaki sabit iletişim çubuğu son satırı örtmesin.
    <footer
      className="pb-24 md:pb-0"
      style={{ background: INK, color: ON_DARK, borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Logo tone="white" className="h-12 w-12" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed" style={{ color: ON_DARK_MUTED }}>
            Restoran ve kafeler için QR menü, masadan sipariş, hesap bölüşme ve
            iyzico güvenceli ödeme.
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase" style={monoLabel}>Ürün</p>
          <ul className="mt-5 space-y-3 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={sectionHref(s.id, home)} className="transition-opacity hover:opacity-70">
                  {s.label}
                </a>
              </li>
            ))}
            {hasCases && (
              <li>
                <Link href="/vaka-calismalari" className="transition-opacity hover:opacity-70">
                  Vaka Çalışmaları
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase" style={monoLabel}>Kurumsal</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link href="/gizlilik-politikasi" className="transition-opacity hover:opacity-70">Gizlilik Politikası</Link></li>
            <li><Link href="/kullanim-sartlari" className="transition-opacity hover:opacity-70">Kullanım Şartları</Link></li>
            <li><Link href="/cerez-politikasi" className="transition-opacity hover:opacity-70">Çerez Politikası</Link></li>
            <li><Link href="/admin/login" className="transition-opacity hover:opacity-70">Personel Girişi</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase" style={monoLabel}>İletişim</p>
          <ul className="mt-5 space-y-3 text-sm">
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
                  <a
                    href={siteContent.mapsUrl}
                    target="_blank"
                    rel="noopener"
                    className="mt-1 inline-block text-white underline underline-offset-4 transition-opacity hover:opacity-70"
                  >
                    Haritada göster
                  </a>
                )}
              </li>
            )}
            {social.map(([key, url]) => (
              <li key={key}>
                <a href={url} target="_blank" rel="noopener" className="transition-opacity hover:opacity-70">
                  {socialLabel[key] ?? key}
                </a>
              </li>
            ))}
          </ul>
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
            />
          </span>
        </div>
      </div>
    </footer>
  );
}

/**
 * Telefonda ekranın altında sabit iletişim çubuğu. Telefon/WhatsApp
 * tanımlıysa "Ara" ve "WhatsApp", her zaman "Demo İste". Masaüstünde yok
 * (orada başlıktaki düğme her zaman görünür).
 */
export function MobileStickyCta({ home = false }: { home?: boolean }) {
  const btn = "flex-1 h-12 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5";
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
          <a href={PUBLIC_SUPPORT_MAILTO} className={btn} style={{ border: "1px solid rgba(255,255,255,0.2)", color: ON_DARK }}>
            E-posta
          </a>
        )}
        <a href={sectionHref("iletisim", home)} className={btn} style={{ background: ON_DARK, color: INK }}>
          Ücretsiz Demo İste
        </a>
      </div>
    </div>
  );
}
