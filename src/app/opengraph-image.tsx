import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Masada QR ile sipariş, hesap bölüşme ve ödeme";

/**
 * Sosyal medyada link paylaşılınca çıkan kapak görseli. Tanıtım sitesinin
 * koyu hero'suyla aynı kimlik: gece laciverti zemin, marka ışıması, gerçek
 * logo. Logonun yanına ad yazılmıyor (bkz. components/Logo.tsx).
 */
export default async function OgImage() {
  const logo = await readFile(path.join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background:
            "radial-gradient(70% 90% at 85% 10%, rgba(108,92,255,0.45), rgba(0,0,0,0) 60%), radial-gradient(60% 70% at 0% 100%, rgba(29,18,109,0.9), rgba(0,0,0,0) 70%), #08061A",
          color: "#F4F3FF",
        }}
      >
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: 28,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} height={80} alt="" />
        </div>
        {/* Satırlar elle bölünüyor: hero başlığıyla aynı ritim (3 satır). */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 72,
            lineHeight: 1.08,
            letterSpacing: -2,
          }}
        >
          <span>Masada sipariş.</span>
          <span>Hesabı bölüş.</span>
          <span style={{ color: "#FFC857" }}>Öde.</span>
        </div>
        <div style={{ fontSize: 30, color: "rgba(244,243,255,0.62)", marginTop: 28 }}>
          Restoran ve kafeler için QR sipariş ve ödeme sistemi
        </div>
      </div>
    ),
    { ...size }
  );
}
