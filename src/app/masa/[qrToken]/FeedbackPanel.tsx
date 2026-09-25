"use client";

import { useState } from "react";

const BRAND_GRADIENT = "linear-gradient(135deg, #fbbf24, #f87171)";

const CRITERIA = [
  { key: "foodRating", label: "Yemek" },
  { key: "serviceRating", label: "Servis" },
  { key: "ambianceRating", label: "Ortam" },
  { key: "valueRating", label: "Fiyat/Performans" },
] as const;

type Ratings = Record<(typeof CRITERIA)[number]["key"], number>;

function storageKey(orderId: string) {
  return `masaqr:feedback:${orderId}`;
}

/**
 * Ödeme sonrası akış: 4 kriterli puanlama → (varsa) Google yorum daveti.
 * Aynı sipariş için bir kez sorulur (sessionStorage); tarayıcı engellerse
 * her seferinde sorar, zararı yok.
 */
export default function FeedbackPanel({
  qrToken,
  orderId,
  googleReviewUrl,
}: {
  qrToken: string;
  orderId: string;
  googleReviewUrl: string | null;
}) {
  const [ratings, setRatings] = useState<Ratings>({
    foodRating: 0,
    serviceRating: 0,
    ambianceRating: 0,
    valueRating: 0,
  });
  const [comment, setComment] = useState("");
  const [stage, setStage] = useState<"rate" | "done" | "hidden">(() => {
    try {
      return sessionStorage.getItem(storageKey(orderId)) ? "hidden" : "rate";
    } catch {
      return "rate"; // private mode vb. — sormaya devam
    }
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function remember() {
    try {
      sessionStorage.setItem(storageKey(orderId), "1");
    } catch {
      /* yok say */
    }
  }

  const allRated = CRITERIA.every((c) => ratings[c.key] > 0);
  const average =
    CRITERIA.reduce((s, c) => s + ratings[c.key], 0) / CRITERIA.length;

  async function submit() {
    if (!allRated) {
      setError("Lütfen her kriter için puan verin");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/masa/${qrToken}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...ratings, comment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gönderilemedi");
        return;
      }
      remember();
      setStage("done");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setSending(false);
    }
  }

  function skip() {
    remember();
    setStage("hidden");
  }

  if (stage === "hidden") return null;

  if (stage === "done") {
    // Mutlu müşteriyi Google'a yönlendir; 4'ün altındaysa yorumu içeride tutup
    // teşekkür et (kötü deneyim müdüre panelden düşer, Google'a değil).
    const happy = average >= 4;
    return (
      <div className="bg-white rounded-xl border p-4 text-center space-y-3">
        <p className="font-medium">Değerlendirmeniz için teşekkürler!</p>
        {happy && googleReviewUrl ? (
          <>
            <p className="text-sm text-gray-500">
              Memnun kaldıysanız Google&apos;da bir yorum bırakmanız bize çok
              yardımcı olur.
            </p>
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setStage("hidden")}
              className="inline-block w-full text-white rounded-lg py-3 font-medium shadow-lg shadow-amber-600/20"
              style={{ background: BRAND_GRADIENT }}
            >
              Google&apos;da Yorum Yap
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Geri bildiriminiz işletmeye iletildi.
          </p>
        )}
        <button
          onClick={() => setStage("hidden")}
          className="text-sm text-gray-400 underline"
        >
          Kapat
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div>
        <p className="font-medium">Deneyiminiz nasıldı?</p>
        <p className="text-xs text-gray-400">
          10 saniyenizi alır, işletmeye anonim iletilir.
        </p>
      </div>
      {CRITERIA.map((c) => (
        <div key={c.key} className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{c.label}</span>
          <div className="flex gap-1" role="radiogroup" aria-label={c.label}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={ratings[c.key] === n}
                aria-label={`${n} yıldız`}
                onClick={() => setRatings({ ...ratings, [c.key]: n })}
                className={`text-2xl leading-none ${
                  n <= ratings[c.key] ? "text-amber-400" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      ))}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        placeholder="Eklemek istediğiniz bir şey var mı? (opsiyonel)"
        rows={2}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={skip}
          className="flex-1 border rounded-lg py-2 text-sm text-gray-600"
        >
          Atla
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="flex-[2] text-white rounded-lg py-2 text-sm font-medium shadow-md shadow-amber-600/20 disabled:opacity-50"
          style={{ background: BRAND_GRADIENT }}
        >
          {sending ? "Gönderiliyor..." : "Gönder"}
        </button>
      </div>
    </div>
  );
}
