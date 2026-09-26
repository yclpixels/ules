"use client";

import { useState } from "react";

const LINKS = [
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#paneller", label: "Paneller" },
  { href: "#guvenlik", label: "Güvenlik" },
  { href: "#nasil-calisir", label: "Nasıl Çalışır" },
  { href: "#sss", label: "SSS" },
  { href: "/admin/login", label: "Personel Girişi" },
];

/** Mobilde nav linkleri sığmadığı için hamburger menüye toplanır (koyu başlık). */
export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={open}
        className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-full"
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
        <div
          className="absolute left-0 right-0 top-full px-4 pb-6 pt-2 flex flex-col text-base"
          style={{
            backgroundColor: "rgba(8,6,26,0.96)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            color: "#F4F3FF",
          }}
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#iletisim"
            onClick={() => setOpen(false)}
            className="mt-5 rounded-full py-3 text-center font-semibold"
            style={{ background: "#F4F3FF", color: "#08061A" }}
          >
            Demo İsteyin
          </a>
        </div>
      )}
    </div>
  );
}
