import { brandIconResponse } from "@/lib/brandIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iPhone "Ana Ekrana Ekle" ikonu. iOS köşeleri kendisi yuvarlar. */
export default function AppleIcon() {
  return brandIconResponse(180, 0);
}
