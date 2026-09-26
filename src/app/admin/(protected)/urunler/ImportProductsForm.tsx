"use client";

import { useActionState } from "react";
import { importProductsAction, type ImportProductsState } from "@/lib/actions";
import { IMPORT_TEMPLATE } from "@/lib/menuImport";

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([IMPORT_TEMPLATE], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "urun-listesi-sablonu.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportProductsForm() {
  const [state, action, pending] = useActionState<ImportProductsState, FormData>(
    importProductsAction,
    undefined
  );

  return (
    <details className="bg-white border rounded-2xl p-4 group">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-medium">
        Excel&apos;den toplu ekle
        <span className="text-sm text-gray-500 group-open:hidden">Aç</span>
      </summary>

      <div className="mt-4 space-y-3 text-sm">
        <ol className="list-decimal pl-5 text-gray-600 space-y-1">
          <li>
            Sütunlar: <b>Ad, Fiyat</b>, Kategori, KDV, Açıklama, Alerjen, Fotoğraf linki (yalnız
            Ad ve Fiyat zorunlu).{" "}
            <button type="button" onClick={downloadTemplate} className="underline font-medium text-[#1D126D]">
              Örnek şablonu indir
            </button>
          </li>
          <li>Excel&apos;de satırları seçip kopyalayın (Ctrl+C) ve aşağıya yapıştırın — ya da CSV dosyasını seçin.</li>
          <li>
            Aynı adlı ürün zaten varsa <b>güncellenir</b> (fiyat listesini yeniden yapıştırmak
            fiyatları günceller). Kategori yoksa oluşturulur.
          </li>
        </ol>

        <form action={action} className="space-y-3">
          <textarea
            name="text"
            rows={6}
            placeholder={"Adana Kebap\t320\tAna Yemekler\t10\nAyran\t45\tİçecekler\t10"}
            className="w-full border rounded-lg px-3 py-2 font-mono text-xs"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="file"
              name="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              className="text-sm file:mr-3 file:h-10 file:rounded-lg file:border file:bg-white file:px-3"
            />
            <button
              type="submit"
              disabled={pending}
              className="h-10 rounded-lg px-4 text-white font-medium bg-[#1D126D] disabled:opacity-50"
            >
              {pending ? "Yükleniyor..." : "Ürünleri ekle"}
            </button>
          </div>
        </form>

        {state?.message && <p className="text-red-600">{state.message}</p>}
        {state && state.added !== undefined && (
          <div className="rounded-xl border p-3 space-y-2">
            <p className="font-medium text-green-700">
              {state.added} ürün eklendi, {state.updated} ürün güncellendi.
            </p>
            {state.errors.length > 0 && (
              <div>
                <p className="text-red-700">{state.errors.length} satır alınmadı:</p>
                <ul className="mt-1 max-h-40 overflow-auto text-red-700 space-y-0.5">
                  {state.errors.map((e, i) => (
                    <li key={i}>
                      Satır {e.line}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
