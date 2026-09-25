"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellIcon, CheckCircleIcon } from "@/components/icons";

const BRAND_GRADIENT = "linear-gradient(135deg, #E0233A, #E0233A)";

type KitchenItem = {
  id: string;
  name: string;
  quantity: number;
  note: string | null;
  tableName: string;
  addedBy: string | null;
  createdAt: string;
};

/**
 * Mutfak / bar ekranı.
 *
 * Sorun şuydu: müşteri ya da garson sipariş giriyor ama mutfağın haberi
 * olmuyordu. Bu ekran 5 saniyede bir yeni kalemleri çeker ve geldiğinde
 * **sesli uyarı** verir — kimsenin ekrana bakmasını beklemez.
 *
 * Ses tarayıcı politikası gereği ancak kullanıcı bir kez dokunduktan sonra
 * çalabilir, bu yüzden açık bir "Sesi aç" düğmesi var. Ses dosyası yok;
 * kısa bir ton Web Audio ile üretiliyor (yüklenecek dosya, gecikme yok).
 */
export default function KitchenBoard({
  markPrepared,
}: {
  markPrepared: (formData: FormData) => void;
}) {
  const [items, setItems] = useState<KitchenItem[] | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bekleme süreleri her yenilemede tazelensin; render sırasında Date.now()
  // çağırmak render'ı saf olmaktan çıkarır ve süreler donuk kalır.
  const [now, setNow] = useState(() => Date.now());
  const audioRef = useRef<AudioContext | null>(null);
  const knownIds = useRef<Set<string> | null>(null);

  function beep() {
    const ctx = audioRef.current;
    if (!ctx) return;
    // İki kısa ton: servis gürültüsünde tek bip kaçabiliyor.
    [0, 0.18].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + offset + 0.14
      );
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.15);
    });
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/mutfak", { cache: "no-store" });
      if (!res.ok) {
        setError("Liste alınamadı");
        return;
      }
      const data: { items: KitchenItem[] } = await res.json();
      setError(null);

      // İlk yüklemede ses çalma; sadece sonradan gelenler için uyar.
      const previous = knownIds.current;
      const incoming = new Set(data.items.map((i) => i.id));
      if (previous && data.items.some((i) => !previous.has(i.id))) {
        beep();
      }
      knownIds.current = incoming;
      setItems(data.items);
      setNow(Date.now());
    } catch {
      setError("Bağlantı hatası");
    }
  }, []);

  useEffect(() => {
    // Efekt gövdesinde senkron setState zincirleme render'a yol açıyor;
    // ilk yükleme bir sonraki tick'e bırakılıyor.
    const first = setTimeout(load, 0);
    const id = setInterval(load, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  function enableSound() {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioRef.current = new Ctor();
      void audioRef.current.resume();
      setSoundOn(true);
      beep(); // kullanıcı sesin nasıl olduğunu duysun
    } catch {
      setError("Bu tarayıcıda ses açılamadı");
    }
  }

  const elapsed = (iso: string) => {
    const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "az önce";
    return `${mins} dk`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          {items === null
            ? "Yükleniyor..."
            : items.length === 0
              ? "Bekleyen sipariş yok."
              : `${items.length} kalem bekliyor`}
        </p>
        {!soundOn ? (
          <button
            onClick={enableSound}
            className="text-white rounded-lg px-4 py-2 text-sm font-medium shadow-md shadow-amber-600/20 flex items-center gap-1.5"
            style={{ background: BRAND_GRADIENT }}
          >
            <BellIcon className="w-4 h-4" />
            Sesli uyarıyı aç
          </button>
        ) : (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircleIcon className="w-4 h-4" />
            Sesli uyarı açık
          </span>
        )}
      </div>

      {!soundOn && (
        <p className="text-xs text-amber-600">
          Tarayıcı, siz izin vermeden ses çalamıyor. Vardiya başında bu düğmeye
          bir kez basın — ekran açık kaldığı sürece yeni siparişlerde uyaracak.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {items?.map((item) => (
          <div
            key={item.id}
            className="bg-white border rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap transition-shadow hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="font-medium">
                <span className="text-gray-400">{item.tableName}</span>{" "}
                · {item.quantity}× {item.name}
              </p>
              {item.note && (
                <p className="text-sm text-amber-600">Not: {item.note}</p>
              )}
              <p className="text-xs text-gray-400">
                {elapsed(item.createdAt)}
                {item.addedBy ? ` · ${item.addedBy}` : " · müşteri"}
              </p>
            </div>
            <form action={markPrepared}>
              <input type="hidden" name="id" value={item.id} />
              <button
                onClick={() => {
                  // Sunucu yanıtını beklemeden listeden düşür: mutfakta
                  // aynı kaleme iki kez basılmasın.
                  setItems((prev) =>
                    prev ? prev.filter((i) => i.id !== item.id) : prev
                  );
                }}
                className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Hazır
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
