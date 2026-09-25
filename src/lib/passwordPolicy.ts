/**
 * Yeni belirlenen şifreler için alt sınır. İstemci formları da kullandığı için
 * `passwords.ts`'ten (server-only) ayrı. Mevcut kısa şifreler çalışmaya devam
 * eder; kural sadece yeni şifre belirlenirken uygulanır.
 */
export const MIN_PASSWORD_LENGTH = 8;
