import Iyzipay from "iyzipay";
import type { PaymentProvider, StartPaymentInput, StartPaymentResult } from "./types";

/**
 * iyzico "Checkout Form" (hosted ödeme formu) entegrasyonu.
 *
 * Kart bilgisi HİÇBİR ZAMAN bizim sunucumuza/istemcimize gelmez — müşteri kart
 * bilgisini doğrudan iyzico'nun kendi güvenli (PCI-DSS) arayüzüne girer.
 * Biz sadece bir "checkout form" başlatıp dönen script'i sayfaya gömüyoruz;
 * ödeme sonucu callbackUrl'e POST edilir ve orada doğrulanır
 * (bkz. src/app/api/payments/iyzico-callback/route.ts).
 *
 * DİKKAT: Bu entegrasyon gerçek iyzico sandbox anahtarları olmadan test
 * edilemedi. Sandbox hesabı alındıktan sonra uçtan uca doğrulanmalı —
 * özellikle `buyer`/`address` alanlarının iyzico'nun beklediği formatla
 * uyuşup uyuşmadığı (bkz. README "Ödeme entegrasyonu" bölümü).
 */
function getClient() {
  return new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
  });
}

export const iyzicoProvider: PaymentProvider = {
  async startPayment(input: StartPaymentInput): Promise<StartPaymentResult> {
    const client = getClient();
    const price = (input.amountCents / 100).toFixed(2);
    const [firstName, ...rest] = (input.payerName || "Misafir Müşteri").split(
      " "
    );
    const surname = rest.join(" ") || "Müşteri";

    // Restoran müşterisinden TC kimlik/adres almak pratik değil; iyzico'nun
    // zorunlu tuttuğu alanlar için makul, sabit değerler kullanıyoruz.
    // Sandbox'ta bunun kabul edilip edilmediği doğrulanmalı.
    const genericBuyer = {
      id: `guest-${input.conversationId}`,
      name: firstName,
      surname,
      gsmNumber: "+905350000000",
      email: "misafir@example.com",
      identityNumber: "74300864791", // iyzico dokümantasyonundaki test TC kimlik no
      registrationAddress: "Restoran salonu",
      ip: input.buyerIp,
      city: "Istanbul",
      country: "Turkey",
      zipCode: "34000",
    };
    const genericAddress = {
      contactName: `${firstName} ${surname}`,
      city: "Istanbul",
      country: "Turkey",
      address: "Restoran salonu",
      zipCode: "34000",
    };

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: input.conversationId,
      price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: input.conversationId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: input.callbackUrl,
      buyer: genericBuyer,
      shippingAddress: genericAddress,
      billingAddress: genericAddress,
      basketItems: [
        {
          id: "masa-hesabi",
          name: "Masa hesabı ödemesi",
          category1: "Yeme-icme",
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price,
        },
      ],
    };

    return new Promise((resolve) => {
      client.checkoutFormInitialize.create(
        request,
        (err: unknown, result: Record<string, unknown>) => {
          if (err) {
            resolve({
              mode: "redirect",
              success: false,
              error: err instanceof Error ? err.message : "iyzico bağlantı hatası",
            });
            return;
          }
          if (result?.status !== "success") {
            resolve({
              mode: "redirect",
              success: false,
              error:
                (result?.errorMessage as string) || "iyzico ödeme başlatılamadı",
            });
            return;
          }
          resolve({
            mode: "redirect",
            success: true,
            checkoutFormContent: result.checkoutFormContent as string,
            token: result.token as string,
          });
        }
      );
    });
  },
};

export async function retrieveCheckoutFormResult(token: string) {
  const client = getClient();
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    client.checkoutForm.retrieve(
      { locale: Iyzipay.LOCALE.TR, token },
      (err: unknown, result: Record<string, unknown>) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
}
