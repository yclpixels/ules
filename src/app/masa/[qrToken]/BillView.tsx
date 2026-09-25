"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatTL } from "@/lib/money";
import FeedbackPanel from "./FeedbackPanel";
import {
  CardIcon,
  CartIcon,
  CheckCircleIcon,
  ListChecksIcon,
  ReceiptIcon,
  ShieldIcon,
  SplitIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";

/** Marka gradyanı (amber → kırmızı) — tanıtım sitesiyle aynı imza renk. */
const BRAND_GRADIENT = "linear-gradient(135deg, #fbbf24, #f87171)";

type BillItem = {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  note: string | null;
  /** Masadan biri bu kalemi üstlendi mi (kaleme göre bölmede seçilemez) */
  settled: boolean;
};

type BillPayment = {
  id: string;
  amountCents: number;
  tipCents: number;
  payerName: string | null;
};

type MenuProduct = {
  id: string;
  name: string;
  priceCents: number;
  description: string | null;
  allergens: string | null;
  imageUrl: string | null;
};
type MenuGroup = { id: string; name: string; products: MenuProduct[] };

type Bill = {
  table: { id: string; name: string };
  orderId: string | null;
  items: BillItem[];
  payments: BillPayment[];
  totalCents: number;
  paidCents: number;
  tipCents: number;
  remainingCents: number;
  closed: boolean;
  menu: MenuGroup[];
  branch: {
    tipPresets: number[];
    googleReviewUrl: string | null;
    cardPaymentEnabled: boolean;
    customerOrderingEnabled: boolean;
    locales: { code: string; label: string }[];
    locale: string;
    websiteUrl: string | null;
  };
};

/** Dil tercihi masa başına saklanır: aynı telefon başka masada da aynı dili görür. */
const LANG_STORAGE_KEY = "masa-qr-lang";

export default function BillView({
  qrToken,
  isDemo,
}: {
  qrToken: string;
  isDemo: boolean;
}) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  // iyzico dönüşünde (?payment=...) doğrudan Hesap sekmesi açılsın
  const [tab, setTab] = useState<"menu" | "bill">(() =>
    paymentStatus ? "bill" : "menu"
  );
  const [mode, setMode] = useState<"equal" | "custom" | "items">("equal");
  // Kaleme göre bölme: müşterinin üstlendiği kalemler
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  /**
   * Menü dili. Turist müşteri dil seçmek zorunda kalmasın diye telefonun
   * dilinden başlar; kullanıcı elle seçerse tercihi bu masa için hatırlanır.
   * Sunucu desteklenmeyen dili şubenin ana diline düşürür.
   */
  const [lang, setLang] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (saved) return saved;
    } catch {
      /* gizli sekme / depolama kapalı — otomatik algılamaya düş */
    }
    return navigator.language?.slice(0, 2).toLowerCase() || null;
  });

  /** Dil seçimini bu cihaz için hatırla (yazılamazsa sorun değil). */
  function chooseLang(code: string) {
    setLang(code);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch {
      /* yoksay */
    }
  }
  const [peopleCount, setPeopleCount] = useState(2);
  const [customAmount, setCustomAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  // Bahşiş: yüzde (preset), "custom" (TL girilir) ya da 0 (yok)
  const [tipChoice, setTipChoice] = useState<number | "custom">(0);
  const [customTip, setCustomTip] = useState("");
  // Bu oturumda ödeme yapıldı mı (anlık ödeme ya da iyzico dönüşü) → teşekkür/anket
  const [justPaid, setJustPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  /**
   * Sepet. Önceden "Ekle"ye dokunulduğu anda sipariş hesaba düşüyordu:
   * yanlış dokunuş doğrudan mutfağa gidiyor, geri alınamıyordu. Artık müşteri
   * sepetini toplar, kontrol eder, sonra gönderir.
   */
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>(
    []
  );
  const [cartNote, setCartNote] = useState("");
  const [sending, setSending] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutFormContent, setCheckoutFormContent] = useState<
    string | null
  >(null);
  const checkoutContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!checkoutFormContent || !checkoutContainerRef.current) return;
    const container = checkoutContainerRef.current;
    container.innerHTML = "";
    // iyzico checkoutFormContent bir <script> bloğudur; innerHTML ile eklenen
    // script'ler tarayıcıda çalışmaz, bu yüzden elle bir script elemanı
    // oluşturup ekliyoruz.
    const wrapper = document.createElement("div");
    wrapper.innerHTML = checkoutFormContent;
    Array.from(wrapper.childNodes).forEach((node) => {
      if (node.nodeName === "SCRIPT") {
        const script = document.createElement("script");
        script.text = (node as HTMLScriptElement).text;
        container.appendChild(script);
      } else {
        container.appendChild(node);
      }
    });
  }, [checkoutFormContent]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/masa/${qrToken}${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Masa yüklenemedi");
        return;
      }
      const data: Bill = await res.json();
      setBill(data);
      setError(null);
    } catch {
      setError("Bağlantı hatası");
    }
  }, [qrToken, lang]);

  useEffect(() => {
    const initial = setTimeout(load, 0);
    const interval = setInterval(load, 4000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [load]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-gray-500">
        Yükleniyor...
      </div>
    );
  }

  const equalShareCents =
    peopleCount > 0 ? Math.ceil(bill.remainingCents / peopleCount) : 0;
  const selectedItemsCents = bill.items
    .filter((i) => selectedItemIds.includes(i.id) && !i.settled)
    .reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  const shareCents =
    mode === "equal"
      ? Math.min(equalShareCents, bill.remainingCents)
      : mode === "items"
        ? // Masadan başkası eşit bölmeyle ödemiş olabilir; kalandan fazlası alınmaz
          Math.min(selectedItemsCents, bill.remainingCents)
        : Math.round(parseFloat(customAmount.replace(",", ".") || "0") * 100);
  const tipCents =
    tipChoice === "custom"
      ? Math.max(
          0,
          Math.round(parseFloat(customTip.replace(",", ".") || "0") * 100)
        )
      : Math.round((shareCents * tipChoice) / 100);
  const amountToPayCents = shareCents + tipCents;
  const menuById = new Map(
    bill.menu.flatMap((g) => g.products).map((p) => [p.id, p])
  );
  const cartLines = cart
    .map((l) => ({ ...l, product: menuById.get(l.productId) }))
    .filter((l) => l.product);
  const cartCount = cart.reduce((n, l) => n + l.quantity, 0);
  const cartTotalCents = cartLines.reduce(
    (sum, l) => sum + l.product!.priceCents * l.quantity,
    0
  );

  const showFeedback =
    (justPaid || paymentStatus === "success" || bill.closed) && !!bill.orderId;

  function addToCart(productId: string) {
    setCartError(null);
    setCart((prev) => {
      const found = prev.find((l) => l.productId === productId);
      return found
        ? prev.map((l) =>
            l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l
          )
        : [...prev, { productId, quantity: 1 }];
    });
  }

  function changeCartQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: l.quantity + delta }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  /** Sepeti tek istekte gönderir; başarılıysa sepet boşalır ve hesap yenilenir. */
  async function sendCart() {
    if (cart.length === 0) return;
    setCartError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/masa/${qrToken}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((l) => ({
            ...l,
            note: cartNote.trim() || null,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCartError(data.error || "Sipariş gönderilemedi");
        return;
      }
      setCart([]);
      setCartNote("");
      setCartOpen(false);
      await load();
      setTab("bill");
    } catch {
      setCartError("Bağlantı hatası, tekrar deneyin");
    } finally {
      setSending(false);
    }
  }

  async function handlePay() {
    if (!bill) return;
    setPayError(null);
    if (!shareCents || shareCents <= 0) {
      setPayError("Geçerli bir tutar girin");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`/api/masa/${qrToken}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: amountToPayCents,
          tipCents,
          payerName: payerName || undefined,
          // Kalem modunda tutarı sunucu kalemlerden hesaplar
          itemIds: mode === "items" ? selectedItemIds : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || "Ödeme başarısız");
      } else if (data.mode === "redirect") {
        setCheckoutFormContent(data.checkoutFormContent);
      } else {
        setCustomAmount("");
        setCustomTip("");
        setTipChoice(0);
        setPayerName("");
        setSelectedItemIds([]);
        setJustPaid(true);
        await load();
      }
    } catch {
      setPayError("Bağlantı hatası, tekrar deneyin");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10 space-y-3">
        <div>
          <h1 className="text-lg font-semibold">{bill.table.name}</h1>
          <p className="text-sm text-gray-500">
            {bill.items.length > 0
              ? `Hesap: ${formatTL(bill.remainingCents)} kaldı`
              : bill.branch.customerOrderingEnabled
                ? "Menüden sipariş verin"
                : "Menüyü inceleyin"}
          </p>
        </div>
        {bill.branch.locales.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            {bill.branch.locales.map((l) => (
              <button
                key={l.code}
                onClick={() => chooseLang(l.code)}
                className={`text-xs rounded-lg px-2 py-1 border transition-colors ${
                  bill.branch.locale === l.code
                    ? "text-white border-transparent"
                    : "bg-white text-gray-600"
                }`}
                style={
                  bill.branch.locale === l.code
                    ? { background: BRAND_GRADIENT }
                    : undefined
                }
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex rounded-lg overflow-hidden border p-1 gap-1 bg-gray-100">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
              tab === "menu" ? "text-white shadow-sm" : "text-gray-600"
            }`}
            style={tab === "menu" ? { background: BRAND_GRADIENT } : undefined}
            onClick={() => setTab("menu")}
          >
            <CartIcon className="w-4 h-4" />
            Menü
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
              tab === "bill" ? "text-white shadow-sm" : "text-gray-600"
            }`}
            style={tab === "bill" ? { background: BRAND_GRADIENT } : undefined}
            onClick={() => setTab("bill")}
          >
            <ReceiptIcon className="w-4 h-4" />
            Hesap{bill.items.length > 0 ? ` (${bill.items.length})` : ""}
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {paymentStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center text-green-700 font-medium">
            Ödemeniz alındı.
          </div>
        )}
        {paymentStatus === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-red-700 font-medium">
            Ödeme tamamlanamadı, tekrar deneyin.
          </div>
        )}
        {tab === "menu" ? (
          bill.menu.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              Menü henüz hazır değil.
            </p>
          ) : (
            <div className="space-y-4">
              {!bill.branch.customerOrderingEnabled && (
                <p className="bg-white border rounded-2xl px-4 py-3 text-sm text-gray-500 text-center">
                  Siparişinizi personele iletebilirsiniz. Hesabınız
                  &quot;Hesap&quot; sekmesinden anlık olarak takip edilebilir.
                </p>
              )}
              {bill.menu.map((group) => (
                <div key={group.id}>
                  <h2 className="text-sm font-semibold text-gray-500 mb-2">
                    {group.name}
                  </h2>
                  <div className="bg-white rounded-2xl border divide-y overflow-hidden">
                    {group.products.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            loading="lazy"
                            className="w-20 h-20 rounded-xl object-cover border shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{p.name}</p>
                          {p.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                              {p.description}
                            </p>
                          )}
                          {p.allergens && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              Alerjen: {p.allergens}
                            </p>
                          )}
                          <p className="text-sm font-medium mt-1">
                            {formatTL(p.priceCents)}
                          </p>
                        </div>
                        {bill.branch.customerOrderingEnabled && (
                          <button
                            onClick={() => addToCart(p.id)}
                            className="text-white text-sm rounded-lg px-3 py-1.5 shrink-0 self-center"
                            style={{ background: BRAND_GRADIENT }}
                          >
                            Ekle
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            {bill.items.length === 0 ? (
              <p className="text-gray-500 text-center py-10">
                Henüz sipariş girilmedi.
              </p>
            ) : (
              <div className="bg-white rounded-2xl border divide-y overflow-hidden">
                {bill.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="font-medium flex items-center gap-1.5">
                        {item.name}
                        {item.settled && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-normal">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            ödendi
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        x{item.quantity}
                      </p>
                      {item.note && (
                        <p className="text-sm text-amber-600">
                          Not: {item.note}
                        </p>
                      )}
                    </div>
                    <p className="font-medium">
                      {formatTL(item.unitPriceCents * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl border p-4 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Toplam</span>
                <span>{formatTL(bill.totalCents)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Ödenen</span>
                <span>{formatTL(bill.paidCents)}</span>
              </div>
              {bill.tipCents > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Bahşiş</span>
                  <span>{formatTL(bill.tipCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-2 mt-1 border-t">
                <span>Kalan</span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: BRAND_GRADIENT }}
                >
                  {formatTL(bill.remainingCents)}
                </span>
              </div>
            </div>

            {bill.payments.length > 0 && (
              <div className="bg-white rounded-2xl border p-4">
                <p className="text-sm font-medium mb-2">Ödemeler</p>
                <div className="space-y-1">
                  {bill.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between text-sm text-gray-600"
                    >
                      <span>
                        {p.payerName || "İsimsiz"}
                        {p.tipCents > 0 &&
                          ` (${formatTL(p.tipCents)} bahşiş dahil)`}
                      </span>
                      <span>{formatTL(p.amountCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showFeedback && bill.orderId && (
              <FeedbackPanel
                qrToken={qrToken}
                orderId={bill.orderId}
                googleReviewUrl={bill.branch.googleReviewUrl}
              />
            )}

            {bill.closed ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center space-y-2">
                <p className="text-green-700 font-medium flex items-center justify-center gap-1.5">
                  <CheckCircleIcon className="w-5 h-5" />
                  Hesap tamamen ödendi. Teşekkürler!
                </p>
                {bill.orderId && (
                  <a
                    href={`/fis/${bill.orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm underline text-green-700"
                  >
                    Fişi Görüntüle
                  </a>
                )}
              </div>
            ) : bill.remainingCents > 0 && !bill.branch.cardPaymentEnabled ? (
              /* Kartlı ödeme kapalı: müşteri payını hesaplasın, tahsilatı
                 personel alsın. Hesabı bölme değeri burada da duruyor. */
              <div className="bg-white rounded-2xl border p-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4 text-amber-600" />
                  Hesabı bölüşün
                </p>
                <div>
                  <label className="text-sm text-gray-500">Kişi sayısı</label>
                  <input
                    type="number"
                    min={1}
                    value={peopleCount}
                    onChange={(e) =>
                      setPeopleCount(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full mt-1 border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Kişi başı</p>
                  <p
                    className="text-3xl font-semibold bg-clip-text text-transparent"
                    style={{ backgroundImage: BRAND_GRADIENT }}
                  >
                    {formatTL(equalShareCents)}
                  </p>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Ödemenizi personele nakit veya kartla yapabilirsiniz.
                  Ödediğiniz tutar bu ekrana anında yansır.
                </p>
              </div>
            ) : bill.remainingCents > 0 ? (
              <div
                className="rounded-2xl p-[2px] shadow-xl shadow-amber-600/10"
                style={{ background: BRAND_GRADIENT }}
              >
              <div className="bg-white rounded-[14px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CardIcon className="w-5 h-5 text-amber-600" />
                    Kartla Öde
                  </p>
                  <span
                    className="inline-flex items-center rounded-md px-2 py-1"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/brand/payment-logos.svg"
                      alt="Visa, Mastercard, American Express, Troy"
                      className="h-3.5 w-auto"
                    />
                  </span>
                </div>
                <div className="flex rounded-lg overflow-hidden border p-1 gap-1 bg-gray-100">
                  {(
                    [
                      ["equal", "Eşit Böl", SplitIcon],
                      ["items", "Kalem Seç", ListChecksIcon],
                      ["custom", "Tutar Gir", WalletIcon],
                    ] as const
                  ).map(([key, label, Icon]) => (
                    <button
                      key={key}
                      className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                        mode === key ? "text-white shadow-sm" : "text-gray-700"
                      }`}
                      style={mode === key ? { background: BRAND_GRADIENT } : undefined}
                      onClick={() => setMode(key)}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {mode === "items" ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">
                      Ne yediyseniz onu işaretleyin — sadece o kalemleri
                      ödersiniz.
                    </p>
                    <div className="border rounded-lg divide-y">
                      {bill.items.map((item) => {
                        const checked = selectedItemIds.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-3 px-3 py-2 ${
                              item.settled
                                ? "opacity-40"
                                : "cursor-pointer hover:bg-gray-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={item.settled}
                              checked={checked}
                              onChange={(e) =>
                                setSelectedItemIds((prev) =>
                                  e.target.checked
                                    ? [...prev, item.id]
                                    : prev.filter((id) => id !== item.id)
                                )
                              }
                            />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm">
                                {item.name} x{item.quantity}
                              </span>
                              {item.settled && (
                                <span className="flex items-center gap-0.5 text-xs text-green-600">
                                  <CheckCircleIcon className="w-3.5 h-3.5" />
                                  başkası üstlendi
                                </span>
                              )}
                            </span>
                            <span className="text-sm">
                              {formatTL(item.unitPriceCents * item.quantity)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedItemsCents > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Seçilen: <strong>{formatTL(shareCents)}</strong>
                      </p>
                    )}
                  </div>
                ) : mode === "equal" ? (
                  <div>
                    <label className="text-sm text-gray-500">
                      Kişi sayısı
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={peopleCount}
                      onChange={(e) =>
                        setPeopleCount(
                          Math.max(1, Number(e.target.value) || 1)
                        )
                      }
                      className="w-full mt-1 border rounded-lg px-3 py-2"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Kişi başı: <strong>{formatTL(equalShareCents)}</strong>
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-gray-500">
                      Ödemek istediğiniz tutar (TL)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full mt-1 border rounded-lg px-3 py-2"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-500">
                    Adınız (opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full mt-1 border rounded-lg px-3 py-2"
                    placeholder="Ör. Ahmet"
                  />
                </div>

                {bill.branch.tipPresets.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-500">
                      Bahşiş bırakmak ister misiniz?
                    </label>
                    <div className="flex gap-2 mt-1">
                      {[0, ...bill.branch.tipPresets].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setTipChoice(pct)}
                          className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                            tipChoice === pct
                              ? "text-white border-transparent shadow-sm"
                              : "bg-white text-gray-700"
                          }`}
                          style={tipChoice === pct ? { background: BRAND_GRADIENT } : undefined}
                        >
                          {pct === 0 ? "Yok" : `%${pct}`}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setTipChoice("custom")}
                        className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                          tipChoice === "custom"
                            ? "text-white border-transparent shadow-sm"
                            : "bg-white text-gray-700"
                        }`}
                        style={tipChoice === "custom" ? { background: BRAND_GRADIENT } : undefined}
                      >
                        Diğer
                      </button>
                    </div>
                    {tipChoice === "custom" && (
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Bahşiş tutarı (TL)"
                        value={customTip}
                        onChange={(e) => setCustomTip(e.target.value)}
                        className="w-full mt-2 border rounded-lg px-3 py-2"
                      />
                    )}
                    {tipCents > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Bahşiş {formatTL(tipCents)} — personele gider, hesaptan
                        düşmez.
                      </p>
                    )}
                  </div>
                )}

                {payError && (
                  <p className="text-sm text-red-600">{payError}</p>
                )}

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-gray-500">Ödenecek tutar</span>
                  <span
                    className="text-2xl font-semibold bg-clip-text text-transparent"
                    style={{ backgroundImage: BRAND_GRADIENT }}
                  >
                    {formatTL(amountToPayCents || 0)}
                  </span>
                </div>

                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full text-white rounded-lg py-3.5 font-medium text-base shadow-lg shadow-amber-600/20 transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                  style={{ background: BRAND_GRADIENT }}
                >
                  {paying ? "İşleniyor..." : "Şimdi Öde"}
                </button>
                <p className="flex items-center justify-center gap-1 text-xs text-gray-400 text-center">
                  <ShieldIcon className="w-3.5 h-3.5" />
                  iyzico güvencesiyle korunan ödeme
                </p>
                {isDemo && (
                  <p className="text-xs text-gray-400 text-center">
                    Demo modu: gerçek kart tahsilatı yapılmıyor.
                  </p>
                )}
              </div>
              </div>
            ) : null}
          </>
        )}
        {bill.branch.websiteUrl && (
          <p className="text-center text-sm pt-6">
            <a
              href={bill.branch.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-gray-500"
            >
              Web sitemiz
            </a>
          </p>
        )}
        {/* KVKK m.10: kişisel verinin toplandığı ekranda aydınlatma metnine erişim */}
        <p className="text-center text-xs text-gray-400 pt-6 pb-2">
          <a href={`/gizlilik?masa=${qrToken}`} className="underline">
            Kişisel Verilerin Korunması Aydınlatma Metni
          </a>
        </p>
      </main>

      {/* Sepet çubuğu: ürün seçildiği anda görünür, gönderilene kadar kalır */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t p-3">
          <div className="max-w-md mx-auto space-y-3">
            {cartOpen && (
              <div className="space-y-2 max-h-64 overflow-auto">
                {cartLines.map((l) => (
                  <div
                    key={l.productId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="flex-1 min-w-0 truncate">
                      {l.product!.name}
                    </span>
                    <button
                      onClick={() => changeCartQty(l.productId, -1)}
                      aria-label="Azalt"
                      className="w-7 h-7 border rounded-lg"
                    >
                      −
                    </button>
                    <span className="w-6 text-center">{l.quantity}</span>
                    <button
                      onClick={() => changeCartQty(l.productId, 1)}
                      aria-label="Artır"
                      className="w-7 h-7 border rounded-lg"
                    >
                      +
                    </button>
                    <span className="w-20 text-right">
                      {formatTL(l.product!.priceCents * l.quantity)}
                    </span>
                  </div>
                ))}
                <input
                  value={cartNote}
                  onChange={(e) => setCartNote(e.target.value)}
                  placeholder="Sipariş notu (ör. acısız olsun)"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}

            {cartError && <p className="text-sm text-red-600">{cartError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setCartOpen((v) => !v)}
                className="flex-1 border rounded-lg py-3 text-sm font-medium flex items-center justify-center gap-1.5"
              >
                <CartIcon className="w-4 h-4" />
                {cartOpen ? "Gizle" : `Sepet (${cartCount}) · ${formatTL(cartTotalCents)}`}
              </button>
              <button
                onClick={sendCart}
                disabled={sending}
                className="flex-1 text-white rounded-lg py-3 font-medium shadow-lg shadow-amber-600/20 disabled:opacity-50"
                style={{ background: BRAND_GRADIENT }}
              >
                {sending ? "Gönderiliyor..." : "Siparişi Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutFormContent && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto p-4 relative">
            <button
              onClick={() => setCheckoutFormContent(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black text-sm"
            >
              Kapat
            </button>
            {/* iyzico'nun checkoutFormContent'i kendi hedef div'ini de içerir */}
            <div ref={checkoutContainerRef} />
          </div>
        </div>
      )}
    </div>
  );
}
