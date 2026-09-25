import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

/**
 * Sekme ikonu (icon.tsx) ve iPhone ana ekran ikonu (apple-icon.tsx) için
 * gerçek logodan kare ikon üretir. Beyaz zemin bilerek var: lacivert logo
 * koyu temalı tarayıcı sekmesinde şeffaf zeminde kaybolurdu.
 *
 * Build sırasında bir kez üretilir (statik), runtime'da dosya okunmaz.
 */
export async function brandIconResponse(size: number, radius: number) {
  const logo = await readFile(path.join(process.cwd(), "public", "logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  // Logo dikey (≈ 0.7 en/boy); kare içinde nefes payı kalsın.
  const logoHeight = Math.round(size * 0.74);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: radius,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} height={logoHeight} alt="" style={{ objectFit: "contain" }} />
      </div>
    ),
    { width: size, height: size }
  );
}
