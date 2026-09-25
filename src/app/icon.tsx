import { brandIconResponse } from "@/lib/brandIcon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Tarayıcı sekmesi ikonu — gerçek logodan üretiliyor (bkz. lib/brandIcon).
 * Önceden projenin ilk commit'inden kalan Next.js varsayılan favicon.ico'su
 * ve düz bir "Ü" harfi duruyordu; ikisi de kaldırıldı.
 */
export default function Icon() {
  return brandIconResponse(32, 7);
}
