/**
 * Sekme geçişinde sunucu yanıtı beklenirken gösterilen iskelet. Üst bant ve
 * sekme şeridi (layout) yerinde kalır, yalnızca içerik alanı değişir.
 * Bu dosya olunca Next.js bağlantıları önceden yükleyip dokunulduğu anda
 * iskelete geçer — ekran "donmuş" gibi durmaz.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Yükleniyor">
      <div className="h-7 w-40 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-white border" />
        <div className="h-24 rounded-2xl bg-white border" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-white border" />
        ))}
      </div>
    </div>
  );
}
