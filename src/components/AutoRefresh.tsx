"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin ekranlarını belirli aralıkla tazeler. Müşteri QR'dan sipariş verdiğinde
 * garsonun ekranı kendiliğinden güncellensin diye (müşteri tarafı zaten 4 sn'de
 * bir poll ediyordu, admin tarafı elle yenileme istiyordu).
 *
 * Form doldurulurken (bir input/select odaktayken) ya da sekme arka plandayken
 * tazeleme atlanır — garsonun yazdığı tutar/not uçmasın.
 */
export default function AutoRefresh({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        return;
      }
      router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
