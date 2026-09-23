"use client";

import { useRef, useState } from "react";

/**
 * Ürün görseli seçici: telefondan fotoğraf çekip yükleme ya da harici link
 * yapıştırma. Kaydedilen değer her iki durumda da tek bir `imageUrl` alanıdır.
 *
 * Fotoğraf sunucuya gönderilmeden önce tarayıcıda küçültülür (en fazla 1400px,
 * JPEG). Restoran sahibi telefondan 5 MB'lık bir fotoğraf seçtiğinde hem
 * yükleme hızlanır hem de müşterinin menüsü mobil veriyle açılabilir kalır —
 * sunucuda görüntü işleme kütüphanesi tutmaya gerek kalmaz.
 */
const MAX_EDGE = 1400;
const JPEG_QUALITY = 0.82;

async function shrink(file: File): Promise<Blob> {
  // Küçültme başarısız olursa (ör. desteklenmeyen format) dosyayı olduğu gibi
  // göndeririz; sunucu tür ve boyut kontrolünü zaten yapıyor.
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 900_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

export default function ImagePicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", await shrink(file), "photo.jpg");
      const res = await fetch("/api/admin/uploads", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Yüklenemedi");
        return;
      }
      setUrl(data.url);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {/* Forma giden asıl değer; yükleme de link yapıştırma da burayı doldurur */}
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-2">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="w-14 h-14 rounded-lg object-cover border shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg border border-dashed flex items-center justify-center text-xs text-gray-400 shrink-0">
            yok
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full border rounded-lg px-2 py-1 text-sm disabled:opacity-50"
          >
            {busy ? "Yükleniyor..." : "Fotoğraf seç / çek"}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-xs text-red-600 hover:underline"
            >
              Görseli kaldır
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      {/* Sitesi olan işletme kendi sitesindeki görselin adresini yapıştırabilir */}
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="ya da görsel adresi: https://..."
        className="w-full border rounded-lg px-2 py-1 text-xs"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
