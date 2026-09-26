import KitchenMockup from "@/components/marketing/KitchenMockup";

/**
 * Tanıtım sitesinde panellerin örnek görünümü. Gerçek ekranların (Kasa,
 * garson ekranı, mutfak, gün sonu) tasarımını birebir yansıtır; veriler
 * örnektir. Resim yerine HTML: hızlı yüklenir, her ekranda keskin kalır ve
 * panel tasarımı değişince burada da aynı sınıflarla güncellenir.
 */

const BRAND = "#1D126D";
const WARM = "#FFC857";

const kasaTables: {
  name: string;
  open?: { left: string; mins: string; items: number; kitchen?: number; paid?: string };
}[] = [
  { name: "Bahçe 1" },
  { name: "Bahçe 2", open: { left: "₺415,00", mins: "14 dk", items: 4, kitchen: 2 } },
  { name: "Masa 1" },
  { name: "Masa 2", open: { left: "₺220,00", mins: "55 dk", items: 3, paid: "₺200,00" } },
  { name: "Masa 3" },
  { name: "Masa 4", open: { left: "₺785,00", mins: "38 dk", items: 5, kitchen: 1 } },
  { name: "Teras 1", open: { left: "₺330,00", mins: "4 dk", items: 3, kitchen: 3 } },
  { name: "Teras 2" },
];

const waiterProducts = [
  ["Adana Kebap", "₺320"],
  ["Izgara Köfte", "₺280"],
  ["Karışık Pizza", "₺250"],
  ["Ayran", "₺45"],
  ["Türk Kahvesi", "₺60"],
  ["Künefe", "₺120"],
];

function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E2EF] bg-white shadow-2xl">
      <div className="flex items-center gap-2 border-b border-[#E4E2EF] bg-[#F7F7FB] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-xs text-[#66657C]">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}

function KasaMock() {
  return (
    <BrowserFrame url="üleş.com/admin — Kasa">
      <div className="flex items-center justify-between border-b border-[#E4E2EF] px-5 py-3">
        <p className="text-sm font-semibold">Kordon Cafe</p>
        <p className="text-xs text-[#66657C]">Kasa · Mutfak · Masalar · Gün Sonu</p>
      </div>
      <div className="space-y-4 bg-[#F7F7FB] p-4 sm:p-5">
        <div className="flex items-end justify-between">
          <p className="text-lg font-semibold">Kasa</p>
          <p className="text-xs text-[#66657C]">4 / 8 masa dolu</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#E4E2EF] bg-white p-3">
            <p className="text-xs text-[#66657C]">Açık hesaplarda kalan</p>
            <p className="text-xl font-semibold" style={{ color: BRAND }}>₺1.750,00</p>
          </div>
          <div className="rounded-xl border border-[#E4E2EF] bg-white p-3">
            <p className="text-xs text-[#66657C]">Açık hesaplarda ödenen</p>
            <p className="text-xl font-semibold">₺200,00</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {kasaTables.map((t) =>
            t.open ? (
              <div
                key={t.name}
                className="flex min-h-[104px] flex-col justify-between rounded-xl p-3 text-white"
                style={{ background: BRAND }}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <span className="text-[10px] text-white/70">{t.open.mins}</span>
                </div>
                <div>
                  <p className="text-base font-bold">{t.open.left}</p>
                  <p className="text-[10px] text-white/70">
                    {t.open.items} ürün{t.open.paid ? ` · ${t.open.paid} ödendi` : ""}
                  </p>
                  {t.open.kitchen && (
                    <span
                      className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: WARM, color: BRAND }}
                    >
                      Mutfakta {t.open.kitchen}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                key={t.name}
                className="flex min-h-[104px] flex-col justify-between rounded-xl border border-dashed border-[#CFCDDD] bg-white p-3"
              >
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-[11px] text-[#9A98AE]">Boş · sipariş aç</p>
              </div>
            )
          )}
        </div>
      </div>
    </BrowserFrame>
  );
}

function WaiterMock() {
  return (
    <div className="rounded-[28px] bg-[#15142A] p-2.5 shadow-2xl">
      <div className="space-y-3 rounded-[20px] bg-white p-3.5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border text-sm">←</span>
          <p className="font-semibold">Masa 4</p>
          <span className="ml-auto text-xs text-[#66657C]">₺785,00 kalan</span>
        </div>
        <div className="flex gap-1.5 overflow-hidden">
          {["Tümü", "Ana Yemekler", "İçecekler", "Tatlılar"].map((c, i) => (
            <span
              key={c}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${i === 0 ? "border-transparent text-white" : "text-[#39384E]"}`}
              style={i === 0 ? { background: BRAND } : undefined}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {waiterProducts.map(([n, p]) => (
            <div key={n} className="relative rounded-lg border p-2">
              <p className="pr-3 text-xs font-medium leading-tight">{n}</p>
              <p className="mt-0.5 text-[11px] text-[#66657C]">{p}</p>
              <span className="absolute right-1 top-0.5 text-xs text-[#9A98AE]">⋯</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
          <span>
            2× Izgara Köfte <span className="text-[#92400e]">· az pişmiş</span>
          </span>
          <span className="font-semibold">₺560,00</span>
        </div>
        <div className="flex gap-2">
          <span className="flex-1 rounded-lg border px-3 py-2 text-xs text-[#9A98AE]">785,00</span>
          <span className="rounded-lg border px-3 py-2 text-xs font-medium">Tamamı</span>
          <span className="rounded-lg px-3 py-2 text-xs font-medium text-white" style={{ background: BRAND }}>
            Ödemeyi Kaydet
          </span>
        </div>
      </div>
    </div>
  );
}

function DayCloseMock() {
  const rows = [
    ["Nakit (kasada olmalı)", "₺4.860,00"],
    ["Kart (POS cihazı)", "₺7.215,00"],
    ["Kart (QR / online)", "₺3.140,00"],
    ["Bahşiş", "₺640,00"],
  ];
  return (
    <div className="space-y-2.5 rounded-2xl border border-[#E4E2EF] bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Gün Sonu</p>
        <span className="text-xs text-[#66657C]">Bugün</span>
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-sm">
          <span className="text-[#66657C]">{k}</span>
          <span className="font-semibold tabular-nums">{v}</span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t pt-2.5">
        <span className="text-sm font-semibold">Toplam tahsilat</span>
        <span className="text-lg font-bold" style={{ color: BRAND }}>₺15.215,00</span>
      </div>
      <p className="rounded-lg bg-[#E7F8EE] px-3 py-2 text-xs font-medium text-[#15803d]">
        Sayılan nakit tutuyor · fark ₺0,00
      </p>
    </div>
  );
}

export default function PanelShowcase() {
  const caption = (title: string, text: string) => (
    <div className="mt-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#5B5B72]">{text}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <KasaMock />
        {caption(
          "Kasa",
          "Bütün masalar tek bakışta: kalan hesap, masanın açık kalma süresi ve mutfakta bekleyen sipariş."
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <WaiterMock />
          {caption(
            "Garson ekranı",
            "Ürüne dokun, siparişe eklensin. Not, adet ve nakit/POS ödeme aynı ekranda."
          )}
        </div>
        <div>
          <KitchenMockup />
          {caption(
            "Mutfak ekranı",
            "Masaya göre fişler, sesli uyarı, bekleme süresine göre renk. Bar tableti yalnızca içecekleri gösterir."
          )}
        </div>
        <div>
          <DayCloseMock />
          {caption(
            "Gün sonu ve raporlar",
            "Nakit, POS, QR ile kart ve bahşiş ayrı ayrı; sayılan kasa ile fark otomatik."
          )}
        </div>
      </div>
      <p className="text-center text-xs text-[#9A98AE]">
        Ekranlar gerçek panelin görünümüdür; tutarlar örnektir.
      </p>
    </div>
  );
}
