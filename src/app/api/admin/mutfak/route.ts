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
        order: {
          table: { branchId: session.branchId },
          // Hesap kapandı diye yemek hazırlanmış olmaz: müşteri önce ödeyip
          // sonra bekleyebilir (kafe, QR ile hemen kartla ödeme). Önceden
          // yalnızca açık hesaplar listeleniyordu ve ödenen masanın siparişi
          // mutfaktan kayboluyordu. İptal edilen hesabın kalemleri gösterilmez;
          // unutulmuş eski kalemler ekranı doldurmasın diye 6 saatle sınırlı.
          OR: [
            { status: "OPEN" },
            {
              status: "CLOSED",
              closedAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
            },
          ],
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        product: {
          select: { name: true, category: { select: { id: true, name: true } } },
        },
        order: { select: { id: true, status: true, table: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      items: items.map((i) => ({
        id: i.id,
        name: i.product.name,
        quantity: i.quantity,
        note: i.note,
        tableName: i.order.table.name,
        orderId: i.order.id,
        orderClosed: i.order.status === "CLOSED",
        // Mutfak/bar ayrımı için: ekran hangi kategorileri göstereceğini
        // cihaz bazında seçer (bar tableti sadece içecekler).
        categoryId: i.product.category?.id ?? null,
        categoryName: i.product.category?.name ?? "Kategorisiz",
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
