import { NextResponse } from "next/server";
import { verifyManagerSession } from "@/lib/dal";
import { saveUpload, MAX_UPLOAD_BYTES } from "@/lib/uploads";

/** Ürün görseli yükleme — sadece müdür. */
export async function POST(req: Request) {
  // Oturum yoksa verifyManagerSession yönlendirme atar; API'de bu 500'e
  // dönebileceği için hatayı yakalayıp düzgün bir 401 veriyoruz.
  try {
    await verifyManagerSession();
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Görsel çok büyük (en fazla 3 MB)" },
      { status: 413 }
    );
  }

  const result = await saveUpload(file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, url: result.url });
}
