/**
 * Marka işareti: iki kişiyi ve aralarındaki gülen yüzü temsil eden tek renkli
 * (lacivert #1D126D) logo, /public/logo.png. Logonun yanına "Üleş" yazısı
 * bilerek konmuyor — işaret tek başına kullanılıyor; erişilebilirlik için
 * adı alt metninde duruyor.
 *
 * `tone="white"`: koyu zeminler (tanıtım sitesinin hero/footer'ı) için aynı
 * görselin beyaz hâli — ayrı dosya yerine CSS filtresiyle üretiliyor, böylece
 * logo değişince iki sürüm birbirinden kopmaz.
 *
 * `?v=`: logo aynı dosya adıyla değiştirildiğinde tarayıcı ve Cloudflare eski
 * görseli önbellekten göstermeye devam ediyordu. Logo her değiştiğinde bu
 * sürüm artırılmalı.
 */
const LOGO_SRC = "/logo.png?v=2";

export default function Logo({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: "brand" | "white";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="Üleş"
      className={className}
      style={{
        objectFit: "contain",
        ...(tone === "white" ? { filter: "brightness(0) invert(1)" } : {}),
      }}
    />
  );
}
