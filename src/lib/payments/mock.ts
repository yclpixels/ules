import type { PaymentProvider } from "./types";

// Demo/geliştirme sağlayıcısı: gerçek tahsilat yapmaz, ödemeyi anında başarılı sayar.
export const mockProvider: PaymentProvider = {
  async startPayment() {
    return { mode: "instant", success: true };
  },
};
