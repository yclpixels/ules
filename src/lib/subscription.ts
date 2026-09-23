import "server-only";
import type { SubscriptionStatus } from "@/generated/prisma/enums";

/**
 * Abonelik durumu yardımcıları.
 *
 * Tahsilat bilerek kodda değil: 1-10 restoranlık ölçekte fatura + EFT doğru
 * yöntem, otomatik kart çekme (recurring) şirket + ödeme kuruluşu altyapısı
 * gerektirir. Burada sadece "hangi şube ne durumda" bilgisi tutulur.
 *
 * Deneme süresi dolunca sistem KENDİLİĞİNDEN kilitlenmez — servis ortasında
 * panelin kapanması restoranı kaybettirir. Uyarı gösterilir, `SUSPENDED`'a
 * geçiş elle yapılır.
 */
export type BranchSubscription = {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
};

export type SubscriptionView = {
  status: SubscriptionStatus;
  /** Deneme bitişine kalan gün; süre dolduysa negatif, deneme yoksa null. */
  daysLeft: number | null;
  expired: boolean;
  /** Müdür panelinde gösterilecek uyarı; gerekmiyorsa null. */
  banner: { text: string; tone: "info" | "warn" | "danger" } | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function describeSubscription(
  branch: BranchSubscription,
  now: Date = new Date()
): SubscriptionView {
  const { subscriptionStatus: status, trialEndsAt } = branch;

  if (status === "SUSPENDED") {
    return {
      status,
      daysLeft: null,
      expired: true,
      banner: {
        text: "Aboneliğiniz durduruldu. Devam etmek için lütfen bizimle iletişime geçin.",
        tone: "danger",
      },
    };
  }

  if (status === "ACTIVE") {
    return { status, daysLeft: null, expired: false, banner: null };
  }

  // TRIAL
  if (!trialEndsAt) {
    return {
      status,
      daysLeft: null,
      expired: false,
      banner: { text: "Ücretsiz deneme sürümünü kullanıyorsunuz.", tone: "info" },
    };
  }

  // Gün farkı: kalan süreyi yukarı yuvarla ki "son gün" 0 değil 1 görünsün.
  const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY_MS);

  if (daysLeft <= 0) {
    return {
      status,
      daysLeft,
      expired: true,
      banner: {
        text: "Ücretsiz deneme süreniz doldu. Sistemi kullanmaya devam etmek için bizimle iletişime geçin.",
        tone: "danger",
      },
    };
  }

  return {
    status,
    daysLeft,
    expired: false,
    banner: {
      text: `Ücretsiz deneme sürümü — bitmesine ${daysLeft} gün kaldı.`,
      tone: daysLeft <= 7 ? "warn" : "info",
    },
  };
}

export const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = {
  TRIAL: "Deneme",
  ACTIVE: "Abone",
  SUSPENDED: "Durduruldu",
};
