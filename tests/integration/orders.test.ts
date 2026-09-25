import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getOrCreateOpenOrder,
  getOrderBill,
  payTowardsOrderInstant,
  recordPendingPayment,
  resolvePendingPayment,
  settleStalePendingPayments,
} from "@/lib/orders";
import { hasTestDb, pendingPayment, resetDb, seedOrder } from "./helpers";

// iyzico'ya gerçekten gidilmez; retrieve sonucunu test belirler.
const retrieve = vi.hoisted(() => vi.fn());
vi.mock("@/lib/payments/iyzico", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/payments/iyzico")>()),
  retrieveCheckoutFormResult: retrieve,
}));
// POS'a kaç bildirim gittiğini saymak için.
const notify = vi.hoisted(() => vi.fn());
vi.mock("@/lib/posWebhook", () => ({ notifyPos: notify }));

describe.skipIf(!hasTestDb)("ödeme akışı (gerçek Postgres)", () => {
  beforeEach(async () => {
    await resetDb();
    retrieve.mockReset();
    notify.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterAll(() => prisma.$disconnect());

  describe("kalem seçerek ödeme", () => {
    it("aynı kalemi aynı anda iki kişi ödeyemez", async () => {
      const { order, items } = await seedOrder([5000, 3000]);
      const ids = [items[0].id];

      const results = await Promise.allSettled([
        payTowardsOrderInstant(order.id, 5000, "Ali", "CARD", undefined, 0, ids),
        payTowardsOrderInstant(order.id, 5000, "Ayşe", "CARD", undefined, 0, ids),
      ]);

      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
      // Kaybedenin ödemesi geri alındı — tahsilat tek.
      expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(1);
      const { paidCents, remainingCents } = await getOrderBill(order.id);
      expect(paidCents).toBe(5000);
      expect(remainingCents).toBe(3000);
    });

    it("başkasının üstlendiği kalem için ödeme oluşturulmaz", async () => {
      const { order, items } = await seedOrder([5000, 1000]);
      await payTowardsOrderInstant(order.id, 5000, "Ali", "CARD", undefined, 0, [items[0].id]);
      await expect(
        recordPendingPayment(order.id, 5000, "Ayşe", "CARD", 0, [items[0].id])
      ).rejects.toThrow(/artık uygun değil/);
      expect(await prisma.payment.count({ where: { status: "PENDING" } })).toBe(0);
    });

    it("başka bir hesabın kalemi seçilemez", async () => {
      const a = await seedOrder([5000]);
      const b = await seedOrder([100]);
      await expect(
        recordPendingPayment(b.order.id, 5000, "X", "CARD", 0, [a.items[0].id])
      ).rejects.toThrow(/artık uygun değil/);
    });
  });

  describe("askıda kalan kartlı ödemeler", () => {
    it("token'ı hiç kaydedilmemiş eski ödeme başarısız sayılır ve kalemler serbest kalır", async () => {
      const { order, items } = await seedOrder([5000]);
      const p = await pendingPayment(order.id, 5000, { minutesAgo: 60, itemIds: [items[0].id] });

      await settleStalePendingPayments({ orderId: order.id });

      expect((await prisma.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("FAILED");
      expect(
        (await prisma.orderItem.findUniqueOrThrow({ where: { id: items[0].id } })).settledPaymentId
      ).toBeNull();
      expect(retrieve).not.toHaveBeenCalled();
    });

    it("müşteri ödeyip callback'e dönmediyse iyzico'ya sorulur ve ödeme alınmış sayılır", async () => {
      const { branch, order, items } = await seedOrder([5000]);
      const p = await pendingPayment(order.id, 5000, {
        minutesAgo: 60,
        providerRef: "tok",
        itemIds: [items[0].id],
      });
      retrieve.mockResolvedValue({
        status: "success",
        paymentStatus: "SUCCESS",
        conversationId: p.id,
        paidPrice: "50.00",
      });

      // Kasa ekranı şube bazında tarar.
      await settleStalePendingPayments({ branchId: branch.id });

      expect(retrieve).toHaveBeenCalledWith("tok");
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("PAID");
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CLOSED");
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: "payment.completed" }));
    });

    it("iyzico ödeme yok diyorsa başarısız sayılır", async () => {
      const { order } = await seedOrder([5000]);
      const p = await pendingPayment(order.id, 5000, { minutesAgo: 60, providerRef: "tok" });
      retrieve.mockResolvedValue({ status: "failure", errorMessage: "expired" });

      await settleStalePendingPayments({ orderId: order.id });
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("FAILED");
    });

    it("iyzico'ya ulaşılamazsa kayda dokunulmaz (para alınmış olabilir)", async () => {
      const { order } = await seedOrder([5000]);
      const p = await pendingPayment(order.id, 5000, { minutesAgo: 60, providerRef: "tok" });
      retrieve.mockRejectedValue(new Error("ECONNRESET"));

      await settleStalePendingPayments({ orderId: order.id });
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("PENDING");
    });

    it("formu hâlâ dolduran müşterinin ödemesine dokunulmaz", async () => {
      const { order } = await seedOrder([5000]);
      const p = await pendingPayment(order.id, 5000, { minutesAgo: 10, providerRef: "tok" });

      await settleStalePendingPayments({ orderId: order.id });
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("PENDING");
      expect(retrieve).not.toHaveBeenCalled();
    });
  });

  it("aynı ödeme aynı anda birkaç kez sonuçlandırılırsa yalnızca bir kez işlenir", async () => {
    const { order } = await seedOrder([5000]);
    const p = await pendingPayment(order.id, 5000, { minutesAgo: 1, providerRef: "tok" });

    await Promise.all([
      resolvePendingPayment(p.id, true),
      resolvePendingPayment(p.id, true),
      resolvePendingPayment(p.id, true),
    ]);

    const paymentEvents = notify.mock.calls.filter(([e]) => e.type === "payment.completed");
    expect(paymentEvents).toHaveLength(1);
    expect((await prisma.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("PAID");
  });

  it("garson ve müşteri aynı anda ilk ürünü eklese de masada tek açık hesap olur", async () => {
    const { table, order } = await seedOrder([]);
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CLOSED", openTableKey: null },
    });

    const orders = await Promise.all(
      Array.from({ length: 5 }, () => getOrCreateOpenOrder(table.id))
    );
    expect(new Set(orders.map((o) => o.id)).size).toBe(1);
    expect(await prisma.order.count({ where: { tableId: table.id, status: "OPEN" } })).toBe(1);
  });
});
