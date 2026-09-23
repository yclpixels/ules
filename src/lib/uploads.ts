import "server-only";
import { randomBytes } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

/**
 * Ürün görseli yükleme.
 *
 * Neden diskte: hedef kurulum tek VPS + Docker. S3/R2 hesap açmayı gerektirir,
 * bu ölçekte gereksiz. Dosyalar UPLOAD_DIR'e yazılır; Docker'da bu klasör
 * volume olarak bağlanmalı, yoksa container yenilenince görseller kaybolur
 * (bkz. README). İleride nesne deposuna geçilecekse değişmesi gereken tek yer burası.
 *
 * Görsel istemcide küçültülüp JPEG'e çevrilerek gönderilir; sunucuda görüntü
 * işleme kütüphanesi yok, bu yüzden boyut sınırı sert uygulanır.
 */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3 MB

const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

/** Dosya adı istemciden gelmez; kendi ürettiğimiz ad kullanılır (path traversal yok). */
const SAFE_NAME = /^[a-f0-9]{24}\.(jpg|png|webp)$/;

export function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

/** İçerik gerçekten iddia ettiği türde mi — uzantıya değil dosyanın başına bakılır. */
function sniffType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export type SaveResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function saveUpload(file: File): Promise<SaveResult> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Görsel çok büyük (en fazla 3 MB)" };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Beyan edilen türe güvenilmez; gerçek içerik türü dosyadan okunur.
  const actual = sniffType(buf);
  const ext = actual ? ALLOWED.get(actual) : undefined;
  if (!ext) {
    return { ok: false, error: "Sadece JPEG, PNG veya WebP görsel yüklenebilir" };
  }

  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);

  return { ok: true, url: `/api/uploads/${name}` };
}

export type ReadResult =
  | { ok: true; body: Buffer; contentType: string }
  | { ok: false };

export async function readUpload(name: string): Promise<ReadResult> {
  if (!SAFE_NAME.test(name)) return { ok: false };

  try {
    const body = await readFile(path.join(uploadDir(), name));
    const actual = sniffType(body);
    if (!actual) return { ok: false };
    return { ok: true, body, contentType: actual };
  } catch {
    return { ok: false };
  }
}
