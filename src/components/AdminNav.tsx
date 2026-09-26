"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/lib/authActions";

export type NavItem = { href: string; label: string };
export type NavGroup = { title: string; items: NavItem[] };

function isActive(pathname: string, href: string) {
  // /admin tam eşleşir; diğerleri alt sayfalarını da kapsar (/admin/masalar/…).
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Günlük sekmeler şeridi (Kasa, Mutfak; müdürde Masalar, Siparişler, Gün
 * Sonu). Önceden Kasa dışındaki her sayfa için önce menü açmak gerekiyordu;
 * servis sırasında en sık geçilen ekranlar artık tek dokunuş.
 */
export function AdminTabs({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Günlük ekranlar" className="overflow-x-auto">
      <ul className="flex gap-1.5 min-w-max">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                  active ? "bg-white text-[#1D126D]" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Menü: yönetim, raporlar, platform ve hesap. Personel çoğunlukla
 * tablet/telefon kullanıyor; panel her ekran boyutunda aynı çalışır.
 */
export default function AdminNav({
  groups,
  userName,
  roleLabel,
}: {
  groups: NavGroup[];
  userName: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menü"
        className="flex h-10 items-center gap-2 rounded-full border border-white/20 px-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
      >
        <span className="flex flex-col gap-[3px]" aria-hidden="true">
          <span className="block w-4 h-[2px] bg-white rounded" />
          <span className="block w-4 h-[2px] bg-white rounded" />
          <span className="block w-4 h-[2px] bg-white rounded" />
        </span>
        <span className="hidden sm:inline">Menü</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 max-h-[75vh] overflow-auto bg-white border rounded-2xl shadow-xl z-50 py-2 text-gray-900">
          {groups.map((group) => (
            <div key={group.title} className="py-1">
              <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {group.title}
              </p>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-11 items-center px-4 text-sm transition-colors ${
                      active ? "text-[#1D126D] font-semibold bg-amber-50" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="border-t mt-1 pt-2">
            <Link
              href="/admin/hesabim"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm"
            >
              <span className="font-medium text-gray-900">{userName}</span>
              <span className="block text-xs text-gray-400">
                {roleLabel} · Hesap ayarları
              </span>
            </Link>
            <form action={logoutAction}>
              <button className="w-full h-11 text-left px-4 text-sm text-red-600 hover:bg-red-50">
                Çıkış yap
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
