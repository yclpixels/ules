import { mockProvider } from "./mock";
import { iyzicoProvider } from "./iyzico";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "iyzico") {
    return iyzicoProvider;
  }
  return mockProvider;
}

export * from "./types";
