"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { formatTL } from "@/lib/money";

const BRAND = "#1D126D";

export type WaiterProduct = {
  id: string;
  name: string;
  priceCents: number;
  categoryId: string | null;
  categoryName: string;
};

/** Türkçe arama: "kofte" yazınca "Köfte" de bulunsun. */
function normalize(v: string) {
  return v
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

/** Ekleme sürerken kutucuk soluklaşır — garson ikinci kez basmasın. */
function TileButton({ product }: { product: WaiterProduct }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-full min-h-[76px] text-left rounded-xl border bg-white px-3 py-2.5 pr-12 active:scale-[0.98] transition disabled:opacity-50 hover:border-gray-400"
    >
      <span className="block font-medium leading-snug">{product.name}</span>
      <span className="block text-sm text-gray-500 mt-0.5">
        {pending ? "Ekleniyor..." : formatTL(product.priceCents)}
      </span>
    </button>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="h-12 rounded-xl px-5 text-white font-medium disabled:opacity-50"
      style={{ background: BRAND }}
    >
      {pending ? "Ekleniyor..." : children}
    </button>
  );
}

/**
 * Garsonun sipariş girdiği panel — tablet/telefonda yoğun serviste
 * kullanılmak üzere: tüm dokunma hedefleri en az 44px, ürünler kutucuk
 * ızgarasında (tek sütunlu uzun liste yavaştı).
 *
 * En sık iş (tek adet ekle) tek dokunuş: kutucuğa basmak. Adet/not gerekiyorsa
 * kutucuğun köşesindeki "⋯" ızgaranın üstünde bir panel açar.
 *
 * Ekleme normal <form> + server action (JavaScript kapalıyken de çalışır);
 * arama/filtre sadece listeyi daraltır.
 */
export default function WaiterOrderPanel({
  tableId,
  products,
  action,
}: {
  tableId: string;
  products: WaiterProduct[];
  action: (formData: FormData) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [detailsFor, setDetailsFor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      const key = p.categoryId ?? "none";
      if (!seen.has(key)) seen.set(key, p.categoryName);
    }
    return [...seen.entries()];
  }, [products]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return products.filter((p) => {
      const inCategory = category === "all" || (p.categoryId ?? "none") === category;
      return inCategory && (!q || normalize(p.name).includes(q));
    });
  }, [products, query, category]);

  const detailProduct = products.find((p) => p.id === detailsFor) ?? null;

  function openDetails(id: string) {
    setQuantity(1);
    setDetailsFor(detailsFor === id ? null : id);
  }

  const chip = (active: boolean) =>
    `shrink-0 h-11 rounded-full px-4 text-sm font-medium border transition-colors ${
      active ? "text-white border-transparent" : "bg-white text-gray-700"
    }`;

  return (
    <div className="bg-white border rounded-2xl p-3 sm:p-4 space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ürün ara..."
        type="search"
        className="w-full h-12 border rounded-xl px-4"
      />

      {categories.length > 1 && (
        // Kaydırılabilir şerit: kategori çoksa satır satır taşıp ürünleri aşağı itmesin.
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={chip(category === "all")}
            style={category === "all" ? { background: BRAND } : undefined}
          >
            Tümü
          </button>
          {categories.map(([id, name]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={chip(category === id)}
              style={category === id ? { background: BRAND } : undefined}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {detailProduct && (
        <form
          action={action}
          // Eklendikten sonra panel açık kalırsa garson aynı ürünü farkında
          // olmadan ikinci kez ekleyebiliyordu. Gönderim başladıktan sonra
          // kapatılır (hemen kapatılırsa form DOM'dan kalkıp gönderim iptal olur).
          onSubmit={() => setTimeout(() => setDetailsFor(null), 0)}
          className="rounded-xl border-2 p-3 space-y-3"
          style={{ borderColor: BRAND }}
        >
          <input type="hidden" name="tableId" value={tableId} />
          <input type="hidden" name="productId" value={detailProduct.id} />
          <input type="hidden" name="quantity" value={quantity} />
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">{detailProduct.name}</p>
            <button
              type="button"
              onClick={() => setDetailsFor(null)}
              aria-label="Kapat"
              className="w-11 h-11 rounded-full border text-lg shrink-0"
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center rounded-xl border">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Azalt"
                className="w-12 h-12 text-xl"
              >
                −
              </button>
              <span className="w-10 text-center text-lg font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                aria-label="Arttır"
                className="w-12 h-12 text-xl"
              >
                +
              </button>
            </div>
            <input
              name="note"
              maxLength={200}
              placeholder="Not: az pişmiş, acısız..."
              className="flex-1 min-w-[160px] h-12 border rounded-xl px-3"
            />
            <SubmitButton>
              {quantity} adet ekle · {formatTL(detailProduct.priceCents * quantity)}
            </SubmitButton>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto">
        {visible.map((p) => (
          <div key={p.id} className="relative">
            {/* En sık yapılan iş: tek adet ekle, tek dokunuş */}
            <form action={action} className="h-full">
              <input type="hidden" name="tableId" value={tableId} />
              <input type="hidden" name="productId" value={p.id} />
              <input type="hidden" name="quantity" value={1} />
              <TileButton product={p} />
            </form>
            <button
              type="button"
              onClick={() => openDetails(p.id)}
              aria-label={`${p.name}: adet ve not`}
              className={`absolute top-1 right-1 w-11 h-11 rounded-lg text-lg ${
                detailsFor === p.id ? "text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
              style={detailsFor === p.id ? { background: BRAND } : undefined}
            >
              ⋯
            </button>
          </div>
        ))}

        {visible.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-gray-500">
            Eşleşen ürün yok.
          </p>
        )}
      </div>
    </div>
  );
}
