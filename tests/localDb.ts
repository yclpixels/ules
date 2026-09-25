/** Entegrasyon testleri tabloları siler — uzak bir veritabanına karşı asla koşmamalı. */
export function assertLocalTestDb(url: string) {
  const host = new URL(url).hostname;
  // "postgres": CI'daki servis konteynerinin adı.
  if (!["localhost", "127.0.0.1", "::1", "[::1]", "postgres"].includes(host)) {
    throw new Error(
      `TEST_DATABASE_URL yerel değil (${host}) — testler tabloları siler, uzak veritabanına karşı çalıştırılmaz.`
    );
  }
}
