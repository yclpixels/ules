"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/lib/authActions";

const BRAND_GRADIENT = "linear-gradient(135deg, #E0233A, #E0233A)";

export type NavItem = { href: string; label: string };
export type NavGroup = { title: string; items: NavItem[] };

/**
 * Admin üst menüsü. Rol arttıkça (özellikle OWNER'da 11 link) tek sıra
 * gezinme okunamaz hale geliyordu; günlük kullanılan "Kasa" dışarıda kalır,
 * gerisi gruplanmış bir panele taşınır.
 *
 * Personel çoğunlukla tablet/telefon kullanıyor, bu yüzden panel her ekran
 * boyutunda aynı şekilde çalışır — ayrı bir masaüstü/mobil davranışı yok.
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
  const onKasa = pathname === "/admin";

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
    <div className="flex items-center gap-2" ref={wrapperRef}>
      {/* Servis sırasında en çok kullanılan ekran; menüye girmeden erişilsin. */}
      <Link
        href="/admin"
        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
          onKasa ? "text-white shadow-sm" : "hover:bg-gray-100"
        }`}
        style={onKasa ? { background: BRAND_GRADIENT } : undefined}
      >
        Kasa
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label="Menü"
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
        >
          <span className="flex flex-col gap-[3px]" aria-hidden="true">
            <span className="block w-4 h-[2px] bg-gray-700 rounded" />
            <span className="block w-4 h-[2px] bg-gray-700 rounded" />
            <span className="block w-4 h-[2px] bg-gray-700 rounded" />
          </span>
          <span className="hidden sm:inline">Menü</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 max-h-[75vh] overflow-auto bg-white border rounded-2xl shadow-lg z-50 py-2">
            {groups.map((group) => (
              <div key={group.title} className="py-1">
                <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        active
                          ? "text-amber-600 font-medium bg-amber-50"
                          : "text-gray-700 hover:bg-gray-50"
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
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  Çıkış yap
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
