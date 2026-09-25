export type StartPaymentInput = {
  conversationId: string; // bizim Payment.id'imiz — callback'te eşleştirmek için
  amountCents: number;
  payerName?: string;
  callbackUrl: string;
  buyerIp: string;
  // Verilirse ödeme iyzico Pazaryeri ile şubenin kendi hesabına bölünerek
  // gönderilir (merchantPriceCents şubeye, kalanı platform komisyonuna
  // gider). Verilmezse tüm tutar platformun tek merkezi hesabında kalır.
  subMerchant?: { key: string; merchantPriceCents: number };
};

export type StartPaymentResult =
  | { mode: "instant"; success: true }
  | { mode: "instant"; success: false; error: string }
  | { mode: "redirect"; success: true; checkoutFormContent: string; token: string }
  | { mode: "redirect"; success: false; error: string };

export interface PaymentProvider {
  startPayment(input: StartPaymentInput): Promise<StartPaymentResult>;
}
