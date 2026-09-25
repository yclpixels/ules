import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Hassas kişisel verinin (IBAN, TC kimlik no) veritabanında şifreli tutulması —
 * KVKK m.12 "veri güvenliği tedbirleri". Veritabanı yedeği ya da bağlantı
 * dizesi sızsa bile bu alanlar anahtar olmadan okunamaz.
 *
 * AES-256-GCM; anahtar FIELD_ENCRYPTION_KEY (base64, 32 bayt:
 * `openssl rand -base64 32`). ANAHTAR KAYBOLURSA ŞİFRELİ ALANLAR GERİ
 * GETİRİLEMEZ — yedeğini veritabanından ayrı bir yerde saklayın.
 *
 * Biçim: "enc:v1:<iv>:<tag>:<şifreli>" (base64). Öneki olmayan değer eski,
 * şifrelenmemiş kayıttır; olduğu gibi okunur ve bir sonraki kayıtta şifrelenir.
 */
const PREFIX = "enc:v1:";

function key(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  const buf = raw ? Buffer.from(raw, "base64") : null;
  if (!buf || buf.length !== 32) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY tanımlı değil ya da 32 bayt değil (openssl rand -base64 32)"
    );
  }
  return buf;
}

export function encryptField(plain: string): string;
export function encryptField(plain: string | null | undefined): string | null;
export function encryptField(plain: string | null | undefined): string | null {
  if (!plain) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [
    PREFIX.slice(0, -1),
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    data.toString("base64"),
  ].join(":");
}

export function decryptField(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored; // eski, şifrelenmemiş kayıt
  const [iv, tag, data] = stored.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Anahtar yapılandırılmış mı — kayıt öncesi kullanıcıya anlaşılır hata vermek için. */
export function hasFieldEncryptionKey(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}
