import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Sosyal medyada link paylaşılınca çıkan kapak görseli. Dışarıdan bir
 * tasarım dosyasına bağımlı olmasın diye kod ile (next/og) üretiliyor —
 * sitenin açık temasıyla ve marka lacivert rengiyla (#1D126D) aynı kimlik.
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
          background: "#ffffff",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "#1D126D",
            marginBottom: 32,
          }}
        />
        <div
          style={{
            fontSize: 96,
            color: "#0a0a0a",
            fontWeight: 800,
          }}
        >
          Üleş
        </div>
        <div style={{ fontSize: 32, color: "#6b7280", marginTop: 16 }}>
          Masada QR ile sipariş, hesap bölüşme ve ödeme
        </div>
      </div>
    ),
    { ...size }
  );
}
