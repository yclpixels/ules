import http from "http";
import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isVerifiedCheckoutResult } from "@/lib/payments/iyzico";
import { isCardPaymentActive, needsSubMerchant } from "@/lib/payments";
import { notifyPos } from "@/lib/posWebhook";

afterEach(() => vi.unstubAllEnvs());

describe("isVerifiedCheckoutResult", () => {
  const pending = { id: "pay1", amountCents: 12550, providerRef: "tok1" };
  const ok = { status: "success", paymentStatus: "SUCCESS", conversationId: "pay1", paidPrice: "125.5" };
  vi.spyOn(console, "error").mockImplementation(() => {});

  it("eşleşen başarılı ödemeyi kabul eder", () => {
    expect(isVerifiedCheckoutResult(ok, "tok1", pending)).toBe(true);
  });
  it.each([
    ["tutar farklı", { ...ok, paidPrice: "1.00" }, "tok1", pending],
    ["token farklı", ok, "tokX", pending],
    ["başka ödemenin sonucu", { ...ok, conversationId: "pay2" }, "tok1", pending],
    ["ödeme başarısız", { ...ok, paymentStatus: "FAILURE" }, "tok1", pending],
    ["kayıtta token yok", ok, "tok1", { ...pending, providerRef: null }],
  ])("reddeder: %s", (_label, result, token, p) => {
    expect(isVerifiedCheckoutResult(result, token as string, p)).toBe(false);
  });
});

describe("kartlı ödeme alt üye şartı", () => {
  it("iyzico'da alt üye kaydı yoksa kartlı ödeme devrede sayılmaz", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "iyzico");
    expect(needsSubMerchant({ subMerchantKey: null })).toBe(true);
    expect(isCardPaymentActive({ cardPaymentEnabled: true, subMerchantKey: null })).toBe(false);
    expect(isCardPaymentActive({ cardPaymentEnabled: true, subMerchantKey: "k" })).toBe(true);
  });
  it("demo (mock) modunda şart aranmaz", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    expect(isCardPaymentActive({ cardPaymentEnabled: true, subMerchantKey: null })).toBe(true);
  });
});

describe("notifyPos", () => {
  it("yavaş POS sunucusu ödemeyi 3 sn'den fazla bekletmez ve istek imzalıdır", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let received: { sig?: string; ts?: string; body: string } | null = null;
    const server = http
      .createServer((req, res) => {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          received = {
            sig: req.headers["x-ules-signature"] as string,
            ts: req.headers["x-ules-timestamp"] as string,
            body,
          };
        });
        setTimeout(() => res.end("ok"), 10_000);
      })
      .listen(0);
    const port = (server.address() as { port: number }).port;
    vi.stubEnv("POS_WEBHOOK_URL", `http://127.0.0.1:${port}/`);
    vi.stubEnv("POS_WEBHOOK_SECRET", "s3cret");

    const t0 = Date.now();
    await notifyPos({ type: "order.closed", orderId: "o", tableId: "t", tableName: "M1", totalCents: 1 });
    expect(Date.now() - t0).toBeLessThan(4000);

    const r = received as unknown as { sig: string; ts: string; body: string };
    const expected = "sha256=" + createHmac("sha256", "s3cret").update(`${r.ts}.${r.body}`).digest("hex");
    expect(r.sig).toBe(expected);
    server.closeAllConnections();
    server.close();
  }, 10_000);
});
