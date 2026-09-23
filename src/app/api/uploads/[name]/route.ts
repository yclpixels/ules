import { NextResponse } from "next/server";
import { readUpload } from "@/lib/uploads";

/**
 * Yüklenen ürün görselini servis eder. Müşteri menüsünden erişildiği için
 * herkese açık — görseller zaten menüde gösteriliyor, gizli veri değil.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const file = await readUpload(name);
  if (!file.ok) {
    return new NextResponse("Bulunamadı", { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.contentType,
      // Dosya adı içeriğe göre üretiliyor ve değişmiyor → uzun süre önbelleklenebilir
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
