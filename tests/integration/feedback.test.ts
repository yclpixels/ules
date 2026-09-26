import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/masa/[qrToken]/feedback/route";
import { hasTestDb, resetDb, seedOrder } from "./helpers";

// Düşük puan uyarısı e-posta göndermeye çalışmasın.
vi.mock("@/lib/feedbackAlerts", () => ({ notifyIfLowRating: vi.fn() }));

const ratings = { foodRating: 5, serviceRating: 5, ambianceRating: 4, valueRating: 5 };

function post(qrToken: string, body: object) {
  return POST(
    new Request(`http://localhost/api/masa/${qrToken}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ qrToken }) }
  );
}

describe.skipIf(!hasTestDb)("müşteri değerlendirmesi", () => {
  beforeEach(resetDb);
  afterAll(() => prisma.$disconnect());

  it("yalnızca masanın en son hesabı değerlendirilebilir", async () => {
    const { table, order: oldOrder } = await seedOrder([5000]);
    await prisma.order.update({
      where: { id: oldOrder.id },
      data: { status: "CLOSED", openTableKey: null, closedAt: new Date() },
    });
    const latest = await prisma.order.create({
      data: { tableId: table.id, status: "CLOSED", createdAt: new Date(Date.now() + 1000) },
    });

    const old = await post(table.qrToken, { orderId: oldOrder.id, ...ratings });
    expect(old.status).toBe(404);

    const ok = await post(table.qrToken, { orderId: latest.id, ...ratings });
    expect(ok.status).toBe(200);
    expect(await prisma.feedback.count()).toBe(1);
  });

  it("başka masanın hesabı değerlendirilemez", async () => {
    const a = await seedOrder([100]);
    const b = await seedOrder([100]);
    const res = await post(a.table.qrToken, { orderId: b.order.id, ...ratings });
    expect(res.status).toBe(404);
  });
});
