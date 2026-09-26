"use client";

import { useEffect } from "react";

/**
 * Sayfa içi bağlantılar (#iletisim, #ozellikler...) bölüme kaydırır ama adres
 * çubuğuna "#..." eklemez. Önceden kopyalanan site linki
 * "https://üleş.com/#iletisim" oluyordu; paylaşılan link temiz kalsın.
 *
 * Dışarıdan "#iletisim" ile gelen ziyaretçi (ör. reklam linki) yine o bölüme
 * iner; kaydırmadan sonra adres temizlenir. JavaScript kapalıyken bağlantılar
 * normal çalışmaya devam eder.
 */
export default function CleanHashLinks() {
  useEffect(() => {
    const clean = () => history.replaceState(null, "", location.pathname + location.search);

    if (location.hash) {
      // Tarayıcı bölüme zaten kaydırdı; sadece adresi temizle.
      const t = setTimeout(clean, 400);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute("href")!.slice(1);
      e.preventDefault();
      if (!id) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
      history.replaceState(null, "", location.pathname + location.search);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
