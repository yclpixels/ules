"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APPLY_HREF, NAV_LINKS, navHref } from "@/content/nav";

/**
 * Telefon ve tablette (lg altı) menü bağlantıları sığmadığı için açılır
 * menüye toplanır. `home`: ana sayfada bölüm bağlantıları "#…".
 */
export default function MobileNav({ home = true }: { home?: boolean }) {
  // Menü hangi sayfada açıldıysa orada açık sayılır: sayfa değişince kendiliğinden kapanır.
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof v === "function" ? v(open) : v) ? pathname : null);

  // Esc ile kapanır.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [...NAV_LINKS, { href: "/admin/login", label: "Personel Girişi" }];

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={open}
        aria-controls="mobil-menu"
        className="w-11 h-11 flex flex-col items-center justify-center gap-1.5 rounded-full"
        style={{ border: "1px solid rgba(255,255,255,0.16)", color: "#F4F3FF" }}
      >
        <span
          className="w-4 h-0.5 bg-current transition-transform"
          style={{ transform: open ? "translateY(4px) rotate(45deg)" : undefined }}
        />
        <span
          className="w-4 h-0.5 bg-current transition-transform"
          style={{ transform: open ? "translateY(-4px) rotate(-45deg)" : undefined }}
        />
      </button>

      {open && (
        <nav
          id="mobil-menu"
          aria-label="Menü"
          className="absolute left-0 right-0 top-full max-h-[calc(100dvh-69px)] overflow-y-auto px-4 pb-6 pt-2 flex flex-col text-base"
          style={{
            backgroundColor: "rgba(8,6,26,0.98)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            color: "#F4F3FF",
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={navHref(l.href, home)}
              onClick={() => setOpen(false)}
              className="py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={APPLY_HREF}
            onClick={() => setOpen(false)}
            className="mt-5 rounded-full py-3.5 text-center font-semibold"
            style={{ background: "#F4F3FF", color: "#08061A" }}
          >
            Demo İsteyin
          </Link>
        </nav>
      )}
    </div>
  );
}
