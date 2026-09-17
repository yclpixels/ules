"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatTL } from "@/lib/money";
import FeedbackPanel from "./FeedbackPanel";

type BillItem = {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  note: string | null;
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
  branch: { tipPresets: number[]; googleReviewUrl: string | null };
};

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
  const [mode, setMode] = useState<"equal" | "custom">("equal");
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
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
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
      const res = await fetch(`/api/masa/${qrToken}`, { cache: "no-store" });
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
  }, [qrToken]);

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
  const shareCents =
    mode === "equal"
      ? Math.min(equalShareCents, bill.remainingCents)
      : Math.round(parseFloat(customAmount.replace(",", ".") || "0") * 100);
  const tipCents =
    tipChoice === "custom"
      ? Math.max(
          0,
          Math.round(parseFloat(customTip.replace(",", ".") || "0") * 100)
        )
      : Math.round((shareCents * tipChoice) / 100);
  const amountToPayCents = shareCents + tipCents;
  const showFeedback =
    (justPaid || paymentStatus === "success" || bill.closed) && !!bill.orderId;

  async function handleAddItem(productId: string) {
    setAddingProductId(productId);
    try {
      const res = await fetch(`/api/masa/${qrToken}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setAddingProductId(null);
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
              : "Menüden sipariş verin"}
          </p>
        </div>
        <div className="flex rounded-lg overflow-hidden border">
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              tab === "menu" ? "bg-black text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setTab("menu")}
          >
            Menü
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium relative ${
              tab === "bill" ? "bg-black text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setTab("bill")}
          >
            Hesap{bill.items.length > 0 ? ` (${bill.items.length})` : ""}
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {paymentStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700 font-medium">
            Ödemeniz alındı.
          </div>
        )}
        {paymentStatus === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-700 font-medium">
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
              {bill.menu.map((group) => (
                <div key={group.id}>
                  <h2 className="text-sm font-semibold text-gray-500 mb-2">
                    {group.name}
                  </h2>
                  <div className="bg-white rounded-xl border divide-y">
                    {group.products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {p.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imageUrl}
                              alt=""
                              loading="lazy"
                              className="w-14 h-14 rounded-lg object-cover border shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">{p.name}</p>
                            {p.description && (
                              <p className="text-xs text-gray-500">{p.description}</p>
                            )}
                            {p.allergens && (
                              <p className="text-xs text-amber-600">
                                Alerjen: {p.allergens}
                              </p>
                            )}
                            <p className="text-sm text-gray-700 mt-0.5">
                              {formatTL(p.priceCents)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddItem(p.id)}
                          disabled={addingProductId === p.id}
                          className="bg-black text-white text-sm rounded-lg px-3 py-1.5 disabled:opacity-50"
                        >
                          {addingProductId === p.id ? "..." : "Ekle"}
                        </button>
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
              <div className="bg-white rounded-xl border divide-y">
                {bill.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
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

            <div className="bg-white rounded-xl border p-4 space-y-1">
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
              <div className="flex justify-between font-semibold text-base pt-1 border-t mt-1">
                <span>Kalan</span>
                <span>{formatTL(bill.remainingCents)}</span>
              </div>
            </div>

            {bill.payments.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
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
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
                <p className="text-green-700 font-medium">
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
            ) : bill.remainingCents > 0 ? (
              <div className="bg-white rounded-xl border p-4 space-y-3">
                <div className="flex rounded-lg overflow-hidden border">
                  <button
                    className={`flex-1 py-2 text-sm font-medium ${
                      mode === "equal"
                        ? "bg-black text-white"
                        : "bg-white text-gray-700"
                    }`}
                    onClick={() => setMode("equal")}
                  >
                    Eşit Böl
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium ${
                      mode === "custom"
                        ? "bg-black text-white"
                        : "bg-white text-gray-700"
                    }`}
                    onClick={() => setMode("custom")}
                  >
                    Tutar Gir
                  </button>
                </div>

                {mode === "equal" ? (
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
                          className={`flex-1 py-2 text-sm rounded-lg border ${
                            tipChoice === pct
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-700"
                          }`}
                        >
                          {pct === 0 ? "Yok" : `%${pct}`}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setTipChoice("custom")}
                        className={`flex-1 py-2 text-sm rounded-lg border ${
                          tipChoice === "custom"
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700"
                        }`}
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

                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-50"
                >
                  {paying
                    ? "İşleniyor..."
                    : `${formatTL(amountToPayCents || 0)} Öde`}
                </button>
                {isDemo && (
                  <p className="text-xs text-gray-400 text-center">
                    Demo modu: gerçek kart tahsilatı yapılmıyor.
                  </p>
                )}
              </div>
            ) : null}
          </>
        )}
      </main>

      {checkoutFormContent && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-auto p-4 relative">
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
