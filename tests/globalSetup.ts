import { execSync } from "child_process";
import { assertLocalTestDb } from "./localDb";

/** Entegrasyon testlerinden önce test veritabanına migration'ları uygular. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return;
  assertLocalTestDb(url);
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
