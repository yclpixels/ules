import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientIpFromHeaders } from "@/lib/rateLimit";

/**
 * KVKK'nın "veri güvenliği tedbirleri" (m.12) kapsamında erişim/işlem kaydı.
 *
 * Rutin işler burada tutulmaz — sipariş kalemini kimin eklediği/sildiği zaten
 * `OrderItem.addedBy/removedBy`'da duruyor. Burası iki şey için:
 *   1) oturum açma denemeleri (yetkisiz erişim tespiti)
 *   2) geri alınamaz ya da parayı/kişisel veriyi etkileyen işlemler
 *
 * En iyi çaba: log yazılamazsa asıl işlem bozulmaz, sadece konsola düşer.
 * Kayıtlar hiçbir yerden silinmez/güncellenmez, sadece eklenir.
 */
export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGED"
  | "STAFF_ADDED"
  | "STAFF_ACTIVATED"
  | "STAFF_DEACTIVATED"
  | "STAFF_PASSWORD_RESET"
  | "ORDER_CANCELLED"
  | "PAYMENT_VOIDED"
  | "DAY_CLOSED"
  | "SETTINGS_UPDATED"
  | "RECEIPT_EMAILED";

/** Aksiyon kodlarının admin ekranında gösterilecek Türkçe karşılığı. */
export const AUDIT_LABELS: Record<AuditAction, string> = {
  LOGIN_SUCCESS: "Giriş yapıldı",
  LOGIN_FAILED: "Başarısız giriş denemesi",
  PASSWORD_CHANGED: "Şifre değiştirildi",
  STAFF_ADDED: "Personel eklendi",
  STAFF_ACTIVATED: "Personel aktif edildi",
  STAFF_DEACTIVATED: "Personel pasifleştirildi",
  STAFF_PASSWORD_RESET: "Personel şifresi sıfırlandı",
  ORDER_CANCELLED: "Hesap ödeme alınmadan kapatıldı",
  PAYMENT_VOIDED: "Ödeme iptal edildi",
  DAY_CLOSED: "Gün sonu kapatıldı",
  SETTINGS_UPDATED: "Şube ayarları değiştirildi",
  RECEIPT_EMAILED: "Fiş e-posta ile gönderildi",
};

type AuditInput = {
  branchId: string;
  action: AuditAction;
  actorName: string;
  actorId?: string | null;
  detail?: string | null;
  /** Route handler'larda Request'ten; server action'larda boş bırakılır (headers() okunur). */
  ip?: string | null;
};

async function resolveIp(explicit?: string | null) {
  if (explicit) return explicit;
  try {
    const ip = clientIpFromHeaders(await headers());
    return ip === "unknown" ? null : ip;
  } catch {
    return null;
  }
}

export async function audit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        branchId: input.branchId,
        action: input.action,
        actorName: input.actorName,
        actorId: input.actorId ?? null,
        detail: input.detail ?? null,
        ip: await resolveIp(input.ip),
      },
    });
  } catch (err) {
    console.error("[audit] kayıt yazılamadı:", input.action, err);
  }
}
