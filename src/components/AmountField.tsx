"use client";

import { useState } from "react";

/**
 * Ödeme tutarı alanı + "Kalanın tamamı" kısayolu. Masanın tamamı tek seferde
 * ödediğinde (en sık durum) garson kalan tutarı elle yazmak zorunda kalmasın.
 * Değer TL cinsinden, sunucudaki parseTLInputToCents'in beklediği biçimde.
 */
export default function AmountField({ remainingCents }: { remainingCents: number }) {
  const [value, setValue] = useState("");
  const full = (remainingCents / 100).toFixed(2).replace(".", ",");

  return (
    <div className="flex-1 min-w-[180px]">
      <label className="text-sm text-gray-500">Tutar (TL)</label>
      <div className="mt-1 flex gap-2">
        <input
          name="amount"
          required
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={full}
          className="w-full min-w-0 h-12 border rounded-xl px-3"
        />
        <button
          type="button"
          onClick={() => setValue(full)}
          className="shrink-0 h-12 rounded-xl border px-3 text-sm font-medium hover:bg-gray-50"
        >
          Tamamı
        </button>
      </div>
    </div>
  );
}
