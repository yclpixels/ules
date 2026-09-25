import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/dal";

/**
 * Mutfak ekranının beslediği liste: açık hesaplardaki, henüz hazırlanmamış
 * kalemler. Ekran bunu kısa aralıklarla çeker ve yeni kalem geldiğinde uyarı
 * sesi çalar — mutfağın ekrana bakmasını beklemek yerine haber verir.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const items = await prisma.orderItem.findMany({
      where: {
        preparedAt: null,
        removedAt: null,
        order: { status: "OPEN", table: { branchId: session.branchId } },
      },
      orderBy: { createdAt: "asc" },
      include: {
        product: { select: { name: true } },
        order: { select: { table: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      items: items.map((i) => ({
        id: i.id,
        name: i.product.name,
        quantity: i.quantity,
        note: i.note,
        tableName: i.order.table.name,
        addedBy: i.addedBy,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    // Gerçek hatayı 401'in arkasına saklamayalım; mutfak ekranı sessizce
    // boş kalırsa servis aksar.
    console.error("[mutfak] liste alınamadı:", err);
    return NextResponse.json({ error: "Liste alınamadı" }, { status: 500 });
  }
}
