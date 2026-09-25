import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Sosyal medyada link paylaşılınca çıkan kapak görseli. Dışarıdan bir
 * tasarım dosyasına bağımlı olmasın diye kod ile (next/og) üretiliyor —
 * marka gradyanıyla (amber → kırmızı) aynı kimlik.
 */
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0f12",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #fbbf24, #f87171)",
            opacity: 0.35,
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #fbbf24, #f87171)",
            marginBottom: 32,
          }}
        />
        <div
          style={{
            fontSize: 96,
            color: "#f2f2f5",
            fontStyle: "italic",
            fontWeight: 600,
          }}
        >
          Üleş
        </div>
        <div style={{ fontSize: 32, color: "#a3a3ae", marginTop: 16 }}>
          Masada QR ile sipariş, hesap bölüşme ve ödeme
        </div>
      </div>
    ),
    { ...size }
  );
}
