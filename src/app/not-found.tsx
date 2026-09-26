import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  robots: { index: false, follow: true },
};

/**
 * 404. İki kitleye birden yol gösterir: masada QR okutan müşteri (kod
 * eskimiş/bozuk olabilir) ve tanıtım sitesini gezen işletme. Arama
 * motorlarına kapalı ama bağlantıları takip edilebilir (iç linkleme).
 */
export default function NotFound() {
  const links = [
    { href: "/", label: "Ana sayfa" },
    { href: "/#paneller", label: "Panelleri inceleyin" },
    { href: "/#sss", label: "Sık sorulan sorular" },
    { href: "/#iletisim", label: "Ücretsiz demo isteyin" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{
        background:
          "radial-gradient(60% 50% at 80% 0%, rgba(124,108,255,0.25), transparent 70%), #F3F2FA",
      }}
    >
      <main className="w-full max-w-md text-center">
        <Link href="/" aria-label="Üleş — ana sayfa" className="inline-block">
          <Logo className="h-14 w-14" />
        </Link>
        <p
          className="mt-8 text-7xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#1D126D" }}
        >
          404
        </p>
        <h1 className="mt-3 text-2xl font-bold">Aradığınız sayfa bulunamadı</h1>
        <p className="mt-3 text-gray-600">
          Masadaki QR kodu okuttuysanız kod eskimiş olabilir — lütfen personele
          haber verin ya da kodu yeniden okutun.
        </p>
        <ul className="mt-8 grid gap-2 sm:grid-cols-2">
          {links.map((l, i) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex h-12 items-center justify-center rounded-full px-4 text-sm font-semibold ${
                  i === 0 ? "text-white" : "border border-gray-300 bg-white"
                }`}
                style={i === 0 ? { background: "#1D126D" } : undefined}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
