import { prisma } from "@/lib/prisma";
import { getOpenOrder, getOrderBill } from "@/lib/orders";
import { formatTL } from "@/lib/money";
import {
  addOrderItemAction,
  removeOrderItemAction,
  recordManualPaymentAction,
  cancelOrderAction,
  voidPaymentAction,
} from "@/lib/actions";
import { notFound } from "next/navigation";
import { verifyAdminSession } from "@/lib/dal";
import AutoRefresh from "@/components/AutoRefresh";
import ConfirmButton from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const session = await verifyAdminSession();
  const { tableId } = await params;
  const table = await prisma.table.findFirst({
    where: { id: tableId, branchId: session.branchId },
  });
  if (!table) notFound();
  const isManager = session.role === "MANAGER";

  const order = await getOpenOrder(tableId);
  const { totalCents, paidCents, tipCents, remainingCents } = order
    ? await getOrderBill(order.id)
    : { totalCents: 0, paidCents: 0, tipCents: 0, remainingCents: 0 };
  const items = order
    ? await prisma.orderItem.findMany({
        where: { orderId: order.id, removedAt: null },
        include: { product: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const payments = order
    ? await prisma.payment.findMany({
        where: { orderId: order.id, status: "PAID" },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const products = await prisma.product.findMany({
    where: { isAvailable: true, branchId: session.branchId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Müşteri QR'dan ürün eklediğinde garsonun ekranı kendiliğinden güncellensin */}
      <AutoRefresh />
      <div>
        <h1 className="text-xl font-semibold">{table.name}</h1>
      </div>

      <form
        action={addOrderItemAction}
        className="bg-white border rounded-xl p-4 flex gap-3 items-end flex-wrap"
      >
        <input type="hidden" name="tableId" value={tableId} />
        <div className="flex-1 min-w-[160px]">
          <label className="text-sm text-gray-500">Ürün</label>
          <select
            name="productId"
            required
            className="w-full mt-1 border rounded-lg px-3 py-2"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatTL(p.priceCents)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <label className="text-sm text-gray-500">Adet</label>
          <input
            type="number"
            name="quantity"
            defaultValue={1}
            min={1}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-sm text-gray-500">Not (opsiyonel)</label>
          <input
            name="note"
            placeholder="Ör. az pişmiş, acısız"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <button className="bg-black text-white rounded-lg px-4 py-2 font-medium">
          Siparişe Ekle
        </button>
      </form>

      <div className="bg-white border rounded-xl divide-y">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="font-medium">{item.product.name}</p>
              <p className="text-sm text-gray-500">
                x{item.quantity} — {formatTL(item.unitPriceCents)}
                {" · "}
                {item.addedBy ? `${item.addedBy} ekledi` : "Müşteri ekledi"}
              </p>
              {item.note && (
                <p className="text-sm text-amber-600">Not: {item.note}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="font-medium">
                {formatTL(item.unitPriceCents * item.quantity)}
              </p>
              <form action={removeOrderItemAction}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="tableId" value={tableId} />
                <ConfirmButton
                  message={`"${item.product.name}" hesaptan silinsin mi?`}
                  className="text-sm text-red-600 hover:underline"
                >
                  Sil
                </ConfirmButton>
              </form>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500">
            Siparişte ürün yok.
          </p>
        )}
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-1">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Toplam</span>
          <span>{formatTL(totalCents)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Ödenen</span>
          <span>{formatTL(paidCents)}</span>
        </div>
        {tipCents > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Bahşiş</span>
            <span>{formatTL(tipCents)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold border-t pt-1 mt-1">
          <span>Kalan</span>
          <span>{formatTL(remainingCents)}</span>
        </div>
      </div>

      {order && remainingCents > 0 && (
        <form
          action={recordManualPaymentAction}
          className="bg-white border rounded-xl p-4 space-y-3"
        >
          <p className="text-sm font-medium">Ödeme Al</p>
          <p className="text-xs text-gray-400">
            Müşteri masada nakit ödediyse ya da restoranın kendi POS/kart
            cihazıyla (temassız/NFC dahil) kart çektiyseniz buradan kaydedin.
          </p>
          <input type="hidden" name="tableId" value={tableId} />
          <input type="hidden" name="orderId" value={order.id} />
          <div className="flex gap-3 items-end flex-wrap">
            <div className="w-36">
              <label className="text-sm text-gray-500">Yöntem</label>
              <select
                name="method"
                defaultValue="CASH"
                className="w-full mt-1 border rounded-lg px-3 py-2"
              >
                <option value="CASH">Nakit</option>
                <option value="CARD">Kart (POS ile)</option>
              </select>
            </div>
            <div className="w-32">
              <label className="text-sm text-gray-500">Tutar (TL)</label>
              <input
                name="amount"
                required
                placeholder={(remainingCents / 100).toFixed(2)}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </div>
            <div className="w-28">
              <label className="text-sm text-gray-500">Bahşiş (TL)</label>
              <input
                name="tip"
                placeholder="0"
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-sm text-gray-500">
                Ödeyen (opsiyonel)
              </label>
              <input
                name="payerName"
                placeholder="Ör. Ahmet"
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </div>
            <button className="bg-black text-white rounded-lg px-4 py-2 font-medium">
              Ödemeyi Kaydet
            </button>
          </div>
        </form>
      )}

      {payments.length > 0 && (
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm font-medium mb-2">Ödemeler</p>
          <div className="space-y-1">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center gap-3 text-sm text-gray-600"
              >
                <span>
                  {p.payerName || "İsimsiz"}
                  {" · "}
                  {p.method === "CASH" ? "Nakit" : "Kart"}
                  {p.recordedBy && ` · ${p.recordedBy} aldı`}
                  {p.tipCents > 0 && ` · ${formatTL(p.tipCents)} bahşiş dahil`}
                </span>
                <span className="flex items-center gap-3">
                  <span>{formatTL(p.amountCents)}</span>
                  {/* Sadece elle girilen ödemeler iptal edilebilir; iyzico
                      ödemeleri sağlayıcı panelinden iade edilmeli. */}
                  {isManager && p.recordedBy && (
                    <form action={voidPaymentAction}>
                      <input type="hidden" name="paymentId" value={p.id} />
                      <input type="hidden" name="tableId" value={tableId} />
                      <ConfirmButton
                        message={`${formatTL(p.amountCents)} tutarındaki ödeme iptal edilsin mi? Bu işlem geri alınamaz.`}
                        className="text-xs text-red-600 hover:underline"
                      >
                        İptal
                      </ConfirmButton>
                    </form>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {order && isManager && (
        <form
          action={cancelOrderAction}
          className="bg-white border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
        >
          <input type="hidden" name="tableId" value={tableId} />
          <input type="hidden" name="orderId" value={order.id} />
          <div>
            <p className="text-sm font-medium">Hesabı ödeme almadan kapat</p>
            <p className="text-xs text-gray-400">
              Müşteri kalktı, ikram edildi ya da masa yanlışlıkla açıldıysa.
              Kalan {formatTL(remainingCents)} tahsil edilmemiş sayılır.
            </p>
          </div>
          <ConfirmButton
            message={`${table.name} hesabı ödeme alınmadan kapatılsın mı? Kalan ${formatTL(remainingCents)} tahsil edilmemiş sayılacak.`}
            className="text-sm border border-red-300 text-red-600 rounded-lg px-4 py-2 hover:bg-red-50"
          >
            İptal Et / Kapat
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
