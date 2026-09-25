"use client";

import { useEffect } from "react";

/**
 * Bu sayfa bir iframe içine gömülüyse (bkz. /admin/ayarlar embed kodu),
 * içerik boyu değiştikçe üst pencereye postMessage ile bildirir; embed
 * kodundaki script bunu dinleyip iframe yüksekliğini otomatik ayarlar.
 * Sabit yükseklik (ör. 800px) kısa menüde boşluk, uzun menüde kesilme
 * yaratıyordu — bu yüzden sabit değer yerine gerçek içerik boyu kullanılır.
 */
export default function EmbedAutoHeight() {
  useEffect(() => {
    if (window.parent === window) return; // gömülü değilse hiçbir şey yapma

    const send = () => {
      window.parent.postMessage(
        { type: "ules-menu-height", height: document.documentElement.scrollHeight },
        "*"
      );
    };

    send();
    const observer = new ResizeObserver(send);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return null;
}
