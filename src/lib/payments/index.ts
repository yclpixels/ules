import { mockProvider } from "./mock";
import { iyzicoProvider } from "./iyzico";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "iyzico") {
    return iyzicoProvider;
  }
  return mockProvider;
}

/**
 * iyzico ile gerçek tahsilatta, şube iyzico'ya alt üye işyeri olarak kayıtlı
 * değilse (subMerchantKey yok) para şubenin değil platformun merkezi
 * hesabına düşerdi. Platform para akışına girmemeli — bu yüzden kayıt
 * tamamlanana kadar kartlı ödeme, ayar açık olsa bile devrede sayılmaz.
 * Demo (mock) modunda para hareketi olmadığı için bu şart aranmaz.
 */
export function needsSubMerchant(branch: { subMerchantKey: string | null }) {
  return process.env.PAYMENT_PROVIDER === "iyzico" && !branch.subMerchantKey;
}

export function isCardPaymentActive(branch: {
  cardPaymentEnabled: boolean;
  subMerchantKey: string | null;
}) {
  return branch.cardPaymentEnabled && !needsSubMerchant(branch);
}

export * from "./types";
