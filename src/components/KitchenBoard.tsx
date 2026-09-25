"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellIcon, CheckCircleIcon } from "@/components/icons";

const BRAND = "#1D126D";
const HIDDEN_KEY = "ules-kitchen-hidden-categories";

type KitchenItem = {
  id: string;
  name: string;
  quantity: number;
  note: string | null;
  tableName: string;
  orderId: string;
  orderClosed: boolean;
  categoryId: string | null;
  categoryName: string;
  addedBy: string | null;
  createdAt: string;
};

type Ticket = {
  orderId: string;
  tableName: string;
  closed: boolean;
  items: KitchenItem[];
  oldest: number;
};

/** Bekleme süresine göre fiş rengi: mutfak geciken masayı uzaktan görsün. */
function urgency(mins: number) {
  if (mins >= 20) return { border: "#dc2626", bg: "#fef2f2", label: "text-red-700" };
  if (mins >= 10) return { border: "#f59e0b", bg: "#fffbeb", label: "text-[#92400e]" };
  return { border: "#e5e7eb", bg: "#ffffff", label: "text-gray-500" };
}

function readHidden(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

/**
 * Mutfak / bar ekranı.
 *
 * 5 saniyede bir açık hesaplardaki hazırlanmamış kalemleri çeker; yeni kalem
 * gelince **sesli uyarı** verir. Ses tarayıcı politikası gereği ancak bir
 * dokunuştan sonra çalabilir ("Sesli uyarıyı aç"); ses dosyası yok, kısa ton
 * Web Audio ile üretiliyor.
 *
 * Görünüm: masaya göre gruplanmış fişler (mutfak masa masa çalışır), bekleme
 * süresine göre renk, uzaktan okunacak yazı boyutu. İstasyon filtresi: bar
 * tableti yalnızca içecekleri, mutfak yalnızca yemekleri gösterebilir — seçim
 * cihazda hatırlanır. Gizli kategoriden gelen sipariş ses de çalmaz.
 */
export default function KitchenBoard({
  markPrepared,
}: {
  markPrepared: (formData: FormData) => void;
}) {
  const [items, setItems] = useState<KitchenItem[] | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  // Bekleme süreleri her yenilemede tazelensin; render sırasında Date.now()
  // çağırmak render'ı saf olmaktan çıkarır ve süreler donuk kalır.
  const [now, setNow] = useState(() => Date.now());
  const audioRef = useRef<AudioContext | null>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const hiddenRef = useRef(hidden);

  useEffect(() => {
    // localStorage sunucuda yok; ilk render'dan sonra oku.
    const stored = readHidden();
    hiddenRef.current = stored;
    const t = setTimeout(() => setHidden(stored), 0);
    return () => clearTimeout(t);
  }, []);

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
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.14);
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

      // İlk yüklemede ses çalma; sadece sonradan gelenler için uyar. Bu
      // istasyonda gizlenen kategoriden gelen sipariş (ör. mutfakta içecek)
      // uyarı vermez.
      const previous = knownIds.current;
      const isVisible = (i: KitchenItem) => !hiddenRef.current.has(i.categoryId ?? "none");
      if (previous && data.items.some((i) => !previous.has(i.id) && isVisible(i))) {
        beep();
      }
      knownIds.current = new Set(data.items.map((i) => i.id));
      setItems(data.items);
      setNow(Date.now());
    } catch {
      setError("Bağlantı hatası");
    }
  }, []);

  useEffect(() => {
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
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioRef.current = new Ctor();
      void audioRef.current.resume();
      setSoundOn(true);
      beep(); // kullanıcı sesin nasıl olduğunu duysun
    } catch {
      setError("Bu tarayıcıda ses açılamadı");
    }
  }

  function toggleCategory(key: string) {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    hiddenRef.current = next;
    setHidden(next);
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
    } catch {
      /* gizli sekme vb. — seçim sadece bu oturumda geçerli kalır */
    }
  }

  function dropLocally(ids: string[]) {
    // Sunucu yanıtını beklemeden listeden düşür: aynı kaleme iki kez basılmasın.
    // Bir sonraki tick'e bırakılıyor: form gönderilmeden DOM'dan kalkarsa
    // tarayıcı gönderimi iptal eder ("form is not connected").
    const set = new Set(ids);
    setTimeout(() => {
      setItems((prev) => (prev ? prev.filter((i) => !set.has(i.id)) : prev));
    }, 0);
  }

  const minutes = (iso: string) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const i of items ?? []) seen.set(i.categoryId ?? "none", i.categoryName);
    for (const key of hidden) if (!seen.has(key)) seen.set(key, "(şu an sipariş yok)");
    return [...seen.entries()];
  }, [items, hidden]);

  const tickets = useMemo<Ticket[]>(() => {
    const byOrder = new Map<string, Ticket>();
    for (const i of items ?? []) {
      if (hidden.has(i.categoryId ?? "none")) continue;
      const created = new Date(i.createdAt).getTime();
      const t = byOrder.get(i.orderId) ?? {
        orderId: i.orderId,
        tableName: i.tableName,
        closed: i.orderClosed,
        items: [],
        oldest: created,
      };
      t.items.push(i);
      t.oldest = Math.min(t.oldest, created);
      byOrder.set(i.orderId, t);
    }
    // En uzun bekleyen masa en başta.
    return [...byOrder.values()].sort((a, b) => a.oldest - b.oldest);
  }, [items, hidden]);

  const visibleCount = tickets.reduce((n, t) => n + t.items.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-lg font-semibold">
          {items === null
            ? "Yükleniyor..."
            : visibleCount === 0
              ? "Bekleyen sipariş yok"
              : `${tickets.length} masa · ${visibleCount} kalem bekliyor`}
        </p>
        {!soundOn ? (
          <button
            onClick={enableSound}
            className="h-12 text-white rounded-xl px-5 font-medium flex items-center gap-2"
            style={{ background: BRAND }}
          >
            <BellIcon className="w-5 h-5" />
            Sesli uyarıyı aç
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-green-700 font-medium">
            <CheckCircleIcon className="w-5 h-5" />
            Sesli uyarı açık
          </span>
        )}
      </div>

      {!soundOn && (
        <p className="text-sm bg-[#fffbeb] border border-[#fde68a] text-[#92400e] rounded-xl px-4 py-3">
          Tarayıcı, siz izin vermeden ses çalamıyor. Vardiya başında bu düğmeye
          bir kez basın — ekran açık kaldığı sürece yeni siparişlerde uyaracak.
        </p>
      )}

      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 items-center">
          <span className="text-sm text-gray-500 shrink-0 mr-1">Bu ekranda:</span>
          {categories.map(([key, name]) => {
            const on = !hidden.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCategory(key)}
                aria-pressed={on}
                className={`shrink-0 h-11 rounded-full px-4 text-sm font-medium border ${
                  on ? "text-white border-transparent" : "bg-white text-gray-400 line-through"
                }`}
                style={on ? { background: BRAND } : undefined}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-red-600 font-medium">{error}</p>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 items-start">
        {tickets.map((t) => {
          const waited = minutes(new Date(t.oldest).toISOString());
          const u = urgency(waited);
          return (
            <div
              key={t.orderId}
              className="rounded-2xl border-2 overflow-hidden"
              style={{ borderColor: u.border, background: u.bg }}
            >
              <div className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2">
                <p className="text-2xl font-bold">
                  {t.tableName}
                  {t.closed && (
                    // Müşteri önce ödedi; yemek yine de masaya gidecek.
                    <span className="ml-2 align-middle text-xs font-semibold rounded-full px-2 py-0.5 bg-gray-900 text-white">
                      Hesap ödendi
                    </span>
                  )}
                </p>
                <p className={`text-lg font-semibold tabular-nums ${u.label}`}>
                  {waited < 1 ? "az önce" : `${waited} dk`}
                </p>
              </div>
              <ul className="divide-y bg-white/70">
                {t.items.map((item) => {
                  const fresh = minutes(item.createdAt) < 2;
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className="w-11 h-11 shrink-0 grid place-items-center rounded-xl text-lg font-bold text-white"
                        style={{ background: BRAND }}
                      >
                        {item.quantity}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold leading-tight">
                          {item.name}
                          {fresh && (
                            <span className="ml-2 align-middle text-xs font-bold rounded-full px-2 py-0.5 bg-green-600 text-white">
                              YENİ
                            </span>
                          )}
                        </p>
                        {item.note && (
                          <p className="mt-1 inline-block text-sm font-semibold rounded-md px-2 py-0.5 bg-[#fef3c7] text-[#92400e]">
                            Not: {item.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.addedBy ?? "Müşteri (QR)"}
                        </p>
                      </div>
                      <form action={markPrepared}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          onClick={() => dropLocally([item.id])}
                          aria-label={`${item.name} hazır`}
                          className="h-12 rounded-xl px-4 font-semibold border-2 border-green-600 text-green-700 hover:bg-green-50"
                        >
                          Hazır
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
              {t.items.length > 1 && (
                <form action={markPrepared} className="p-3">
                  {t.items.map((i) => (
                    <input key={i.id} type="hidden" name="id" value={i.id} />
                  ))}
                  <button
                    onClick={() => dropLocally(t.items.map((i) => i.id))}
                    className="w-full h-12 rounded-xl bg-green-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    {t.tableName} — tümü hazır
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
