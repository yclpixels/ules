/**
 * Marka işareti: kullanıcının kendisi için özel ürettirdiği, iki kişiyi ve
 * aralarındaki gülen yüzü temsil eden logo — orijinal renkleriyle (turuncu/
 * lacivert) kullanılıyor, /public/logo.png. Kaynak dosya şeffaflık
 * önizlemesinin (satranç deseni) JPEG'e düz piksel olarak gömülmüş hâliydi;
 * bu yüzden gerçek alfa kanalı olan bir PNG'ye dönüştürülüp kırpıldı
 * (bkz. commit mesajı) — görsel içerik/renk değiştirilmedi.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Üleş"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
