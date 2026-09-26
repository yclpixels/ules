import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Tanıtım sitesinin ortak tasarım dili — ana sayfadaki değerlerle aynı
 * (app/page.tsx). Yeni sayfalar buradan alır ki her sayfa aynı sesi
 * konuşsun: koyu gece laciverti bantlar, açık lavanta bölümler, Archivo
 * başlıklar, küçük mono etiketler.
 */
export const INK = "#08061A";
export const INK_CARD = "#0F0B2E";
export const BRAND = "#1D126D";
export const ACCENT = "#7C6CFF";
export const WARM = "#FFC857";
export const ON_DARK = "#F4F3FF";
export const ON_DARK_MUTED = "rgba(244,243,255,0.62)";
export const SOFT = "#F3F2FA";
export const MUTED = "#5B5B72";
export const LINE = "#E7E5F4";

export const displayFont = { fontFamily: "var(--font-display)" } as const;
export const monoFont = { fontFamily: "var(--font-mono)" } as const;

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className="inline-flex items-center gap-2 text-[11px] uppercase"
      style={{ ...monoFont, letterSpacing: "0.22em", color: dark ? ON_DARK_MUTED : MUTED }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dark ? WARM : ACCENT }} />
      {children}
    </p>
  );
}

export function Check({ dark = false }: { dark?: boolean }) {
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

/** Bölüm başlığı (h2). */
export function SectionTitle({
  eyebrow,
  title,
  intro,
  dark = false,
  center = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  dark?: boolean;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <h2
        className="mt-5 text-3xl leading-[1.1] sm:text-[44px]"
        style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
      >
        {title}
      </h2>
      {intro && (
        <p className="mt-5 text-lg leading-relaxed" style={{ color: dark ? ON_DARK_MUTED : MUTED }}>
          {intro}
        </p>
      )}
    </div>
  );
}

const btnBase =
  "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-center font-semibold transition-[transform,background-color] duration-200 active:scale-[0.98]";

/** Birincil / ikincil düğme bağlantısı; koyu ve açık zeminde. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  dark = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  dark?: boolean;
}) {
  const style =
    variant === "primary"
      ? dark
        ? { background: ON_DARK, color: INK }
        : { background: BRAND, color: "#ffffff" }
      : dark
        ? { border: "1px solid rgba(255,255,255,0.22)", color: ON_DARK }
        : { border: `1px solid ${LINE}`, color: INK, background: "#ffffff" };
  const hover = variant === "primary" ? "hover:-translate-y-0.5" : dark ? "hover:bg-white/10" : "hover:bg-[#F7F6FC]";
  const external = href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("http");
  return external ? (
    <a href={href} className={`${btnBase} ${hover}`} style={style}>
      {children}
    </a>
  ) : (
    <Link href={href} className={`${btnBase} ${hover}`} style={style}>
      {children}
    </Link>
  );
}

/** Sayfa sonlarındaki koyu çağrı bandı. */
export function CtaBand({
  title,
  text,
  primary,
  secondary,
}: {
  title: string;
  text: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section
      style={{
        background: `radial-gradient(60% 70% at 15% 20%, rgba(124,108,255,0.32), transparent 65%), ${INK}`,
        color: ON_DARK,
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-20 sm:px-6 sm:py-24 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h2
            className="text-3xl leading-[1.1] sm:text-[44px]"
            style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.03em" }}
          >
            {title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: ON_DARK_MUTED }}>
            {text}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ButtonLink href={primary.href} dark>
            {primary.label}
          </ButtonLink>
          {secondary && (
            <ButtonLink href={secondary.href} variant="secondary" dark>
              {secondary.label}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}
