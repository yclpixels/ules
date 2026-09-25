/**
 * Mutfak ekranının (admin/mutfak) sadeleştirilmiş HTML temsili — tanıtım
 * sitesinin özellik satırında kullanılıyor. Gerçek ekranın yapısını
 * (masa adı, bekleme süresi, kalemler + not, "Hazır" butonu, sesli uyarı)
 * birebir yansıtır; ürün adları örnektir.
 */
const tickets = [
  {
    table: "Masa 4",
    wait: "1 dk",
    fresh: true,
    items: [
      { qty: 2, name: "Izgara Köfte", note: "az pişmiş" },
      { qty: 1, name: "Ayran" },
    ],
  },
  {
    table: "Bahçe 2",
    wait: "6 dk",
    fresh: false,
    items: [
      { qty: 1, name: "Karışık Pizza" },
      { qty: 3, name: "Limonata", note: "buzsuz" },
    ],
  },
];

export default function KitchenMockup({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-[28px] p-4 sm:p-5 shadow-2xl ${className ?? ""}`}
      style={{
        background: "#0F0B2E",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#F4F3FF",
      }}
    >
      <div className="flex items-center justify-between px-1 pb-4">
        <p className="font-semibold">Mutfak</p>
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
          style={{ background: "rgba(255,200,87,0.12)", color: "#FFC857" }}
        >
          <span className="ules-pulse w-2 h-2 rounded-full" style={{ background: "#FFC857" }} />
          Sesli uyarı açık
        </span>
      </div>
      <div className="space-y-3">
        {tickets.map((t) => (
          <div
            key={t.table}
            className="rounded-2xl p-4"
            style={{
              background: t.fresh ? "rgba(124,108,255,0.14)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${t.fresh ? "rgba(124,108,255,0.45)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{t.table}</p>
              <p className="text-xs" style={{ color: "rgba(244,243,255,0.55)" }}>
                {t.fresh ? "Yeni · " : ""}
                {t.wait}
              </p>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {t.items.map((i) => (
                <li key={i.name} className="flex items-center justify-between gap-3">
                  <span>
                    <span style={{ color: "#A99BFF" }}>{i.qty}×</span> {i.name}
                    {i.note && (
                      <span className="block text-xs" style={{ color: "rgba(244,243,255,0.5)" }}>
                        Not: {i.note}
                      </span>
                    )}
                  </span>
                  <span
                    className="shrink-0 rounded-lg px-3 py-1 text-xs font-medium"
                    style={{ background: "#F4F3FF", color: "#0F0B2E" }}
                  >
                    Hazır
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
