import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Tarayıcı sekmesi ikonu. Önceden Next.js'in varsayılan ikonu duruyordu —
 * marka gradyanıyla (amber → kırmızı) tutarlı, kod ile üretilen bir ikon.
 * Logo.tsx'teki ince çizgili motif bu kadar küçük boyutta kaybolduğu için
 * burada daha okunaklı olan kalın "Ü" harfi kullanılıyor.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #E0233A, #E0233A)",
          color: "#161619",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        Ü
      </div>
    ),
    { ...size }
  );
}
