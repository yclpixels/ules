/**
 * Sunday'in "Built for how you already run" bölümünde gerçek ürün ekran
 * görüntüleri kullanmasından esinlenildi — ama biz sahte bir ekran görüntüsü
 * üretmek yerine gerçekten çalışan ürünü canlı iframe ile gösteriyoruz.
 * Bu, halka açık menü sayfası (/menu/[slug]) — zaten SEO'ya açık ve
 * gömülmek üzere tasarlanmış (bkz. admin/ayarlar embed kodu).
 *
 * DİKKAT: `src` prod ortamında kalıcı bir demo şubeye işaret etmeli.
 * Şu an geliştirme ortamındaki seed verisinin menuSlug'ını kullanıyor.
 */
export default function LivePreviewFrame({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <div className={`relative mx-auto ${className ?? ""}`} style={{ width: 280 }}>
      <div className="relative rounded-[36px] bg-[#161619] border-2 border-white/15 shadow-2xl p-3">
        <div className="absolute left-1/2 top-3 -translate-x-1/2 w-14 h-1.5 rounded-full bg-black/50 z-10" />
        <div className="rounded-[22px] overflow-hidden bg-[#0f0f12]" style={{ height: 560 }}>
          <iframe
            src={src}
            title="Üleş canlı önizleme"
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
