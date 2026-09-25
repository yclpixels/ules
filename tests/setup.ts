/**
 * Her test dosyasından önce çalışır. Testler ASLA .env'deki (canlı olabilecek)
 * veritabanına bağlanmamalı: entegrasyon testleri yalnızca TEST_DATABASE_URL
 * ile, yalnızca yerel bir adrese karşı koşar. Tanımlı değilse DATABASE_URL
 * bilerek ulaşılamaz bir adrese çevrilir — yanlışlıkla bir sorgu kaçsa bile
 * hiçbir yere gitmez.
 */
import { assertLocalTestDb } from "./localDb";

const testUrl = process.env.TEST_DATABASE_URL;
if (testUrl) {
  assertLocalTestDb(testUrl);
  process.env.DATABASE_URL = testUrl;
} else {
  process.env.DATABASE_URL = "postgresql://no-test-db@127.0.0.1:1/none";
}
process.env.SESSION_SECRET ??= "test-secret";
