"use client";

import { useMemo, useState } from "react";
import { formatTL } from "@/lib/money";

const BRAND_GRADIENT = "linear-gradient(135deg, #E0233A, #E0233A)";

export type WaiterProduct = {
  id: string;
  name: string;
  priceCents: number;
  categoryId: string | null;
  categoryName: string;
};

/**
 * Garsonun sipariş girdiği panel.
 *
 * Önceki hali tüm ürünleri tek bir <select> içinde listeliyordu; 60-80 ürünlü
 * gerçek bir menüde yoğun serviste kullanılamıyordu. Artık kategori filtresi,
 * arama ve ürüne dokunarak ekleme var.
 *
 * Ekleme hâlâ normal bir <form> + server action ile yapılıyor (JavaScript
 * kapalıysa bile çalışır); arama/filtre sadece listeyi daraltır. Miktar ve not
 * gerekiyorsa ürünün yanındaki "+" ile açılır — her seferinde görünmez ki
 * en sık yapılan iş (tek adet ekle) tek dokunuş kalsın.
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
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      const key = p.categoryId ?? "none";
      if (!seen.has(key)) seen.set(key, p.categoryName);
    }
    return [...seen.entries()];
  }, [products]);

  const visible = useMemo(() => {
    // Türkçe arama: "kofte" yazınca "Köfte" de bulunsun.
    const norm = (v: string) =>
      v
        .toLocaleLowerCase("tr")
        .replaceAll("ı", "i")
        .replaceAll("ş", "s")
        .replaceAll("ğ", "g")
        .replaceAll("ü", "u")
        .replaceAll("ö", "o")
        .replaceAll("ç", "c");
    const q = norm(query.trim());
    return products.filter((p) => {
      const inCategory =
        category === "all" || (p.categoryId ?? "none") === category;
      return inCategory && (!q || norm(p.name).includes(q));
    });
  }, [products, query, category]);

  return (
    <div className="bg-white border rounded-2xl p-4 space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ürün ara..."
        className="w-full border rounded-lg px-3 py-2"
      />

      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`text-sm rounded-lg px-3 py-1 border transition-colors ${
              category === "all" ? "text-white border-transparent" : ""
            }`}
            style={category === "all" ? { background: BRAND_GRADIENT } : undefined}
          >
            Tümü
          </button>
          {categories.map(([id, name]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={`text-sm rounded-lg px-3 py-1 border transition-colors ${
                category === id ? "text-white border-transparent" : ""
              }`}
              style={category === id ? { background: BRAND_GRADIENT } : undefined}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="border rounded-lg divide-y max-h-80 overflow-auto">
        {visible.map((p) => (
          <div key={p.id} className="px-3 py-2">
            <div className="flex items-center gap-2">
              {/* En sık yapılan iş: tek adet ekle, tek dokunuş */}
              <form action={action} className="flex-1 min-w-0">
                <input type="hidden" name="tableId" value={tableId} />
                <input type="hidden" name="productId" value={p.id} />
                <input type="hidden" name="quantity" value={1} />
                <button
                  type="submit"
                  className="w-full text-left hover:bg-gray-100 rounded px-1 py-1"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-gray-500">
                    {" "}
                    — {formatTL(p.priceCents)}
                  </span>
                </button>
              </form>
              <button
                type="button"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                aria-label="Adet ve not"
                className="text-sm border rounded-lg px-2 py-1 shrink-0"
              >
                {expanded === p.id ? "×" : "⋯"}
              </button>
            </div>

            {expanded === p.id && (
              <form
                action={action}
                className="flex gap-2 items-end mt-2 flex-wrap"
              >
                <input type="hidden" name="tableId" value={tableId} />
                <input type="hidden" name="productId" value={p.id} />
                <div className="w-20">
                  <label className="text-xs text-gray-500">Adet</label>
                  <input
                    type="number"
                    name="quantity"
                    defaultValue={1}
                    min={1}
                    max={99}
                    className="w-full border rounded-lg px-2 py-1"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-gray-500">Not</label>
                  <input
                    name="note"
                    placeholder="az pişmiş, acısız"
                    className="w-full border rounded-lg px-2 py-1"
                  />
                </div>
                <button
                  className="text-white rounded-lg px-3 py-1.5 text-sm font-medium"
                  style={{ background: BRAND_GRADIENT }}
                >
                  Ekle
                </button>
              </form>
            )}
          </div>
        ))}

        {visible.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-gray-500">
            Eşleşen ürün yok.
          </p>
        )}
      </div>
    </div>
  );
}
