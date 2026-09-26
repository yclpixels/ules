"use client";

import { useEffect } from "react";
import Logo from "@/components/Logo";

/**
 * Genel hata ekranı. "Tekrar dene" (reset) yerine sayfayı tamamen yeniler:
 * en sık sebep, sayfa eski sürümden açıkken yeni sürüm yayına girmesi
 * (eski form/düğme kimliklerini sunucu tanımıyor) — bu ancak tam yenilemeyle
 * düzelir. Hata kodu (digest) Railway günlüğündeki satırla eşleşir; kullanıcı
 * bunu söylerse asıl hata bulunabilir.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ui] hata:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-sm">
        <Logo className="w-10 h-10 mx-auto" />
        <p className="text-lg font-semibold">Bir şeyler ters gitti</p>
        <p className="text-sm text-gray-500">
          Sayfayı yenileyip tekrar deneyin; sorun sürerse personele haber verin.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="h-11 text-white rounded-lg px-5 text-sm font-medium"
          style={{ background: "#1D126D" }}
        >
          Sayfayı yenile
        </button>
        {error.digest && (
          <p className="text-xs text-gray-400">Hata kodu: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
