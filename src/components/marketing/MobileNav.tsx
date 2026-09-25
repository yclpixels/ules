"use client";

import { useState } from "react";

const LINKS = [
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#nasil-calisir", label: "Nasıl Çalışır" },
  { href: "#iletisim", label: "İletişim" },
];

/** Mobilde nav linkleri sığmadığı için hamburger menüye toplanır. */
export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menü"
        className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg"
        style={{ border: "1px solid #e5e7eb" }}
      >
        <span className="w-4 h-0.5 bg-current" />
        <span className="w-4 h-0.5 bg-current" />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full px-4 py-3 flex flex-col gap-3 text-sm"
          style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #eeeeee" }}
        >
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
