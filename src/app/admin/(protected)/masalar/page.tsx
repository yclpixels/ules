import QRCode from "qrcode";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  addTableAction,
  updateTableAction,
  deleteTableAction,
} from "@/lib/actions";
import { getBaseUrl } from "@/lib/baseUrl";
import { byNaturalName } from "@/lib/money";
import { verifyManagerSession } from "@/lib/dal";
import ConfirmButton from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function MasalarPage() {
  const session = await verifyManagerSession();

  const tables = await prisma.table.findMany({
    where: { branchId: session.branchId },
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });
  tables.sort(byNaturalName);
  const baseUrl = await getBaseUrl();

  const tablesWithQr = await Promise.all(
    tables.map(async (table) => {
      const url = `${baseUrl}/masa/${table.qrToken}`;
      const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 200 });
      // İndirme için yüksek çözünürlük: matbaaya/tasarımcıya gönderilebilsin.
      const qrPngUrl = await QRCode.toDataURL(url, { margin: 2, width: 1024 });
      return { ...table, url, qrDataUrl, qrPngUrl };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Masalar</h1>
          <p className="text-sm text-gray-500">
            Her masanın kendi QR kodu var; masa adını değiştirmek kodu bozmaz.
          </p>
        </div>
        {tablesWithQr.length > 0 && (
          <Link
            href="/admin/masalar/yazdir"
            className="h-11 inline-flex items-center rounded-lg px-4 text-sm font-medium text-white"
            style={{ background: "#1D126D" }}
          >
            QR kartlarını yazdır
          </Link>
        )}
      </div>

      <form
        action={addTableAction}
        className="bg-white border rounded-2xl p-4 flex gap-3 items-end"
      >
        <div className="flex-1">
          <label className="text-sm text-gray-500">Yeni masa adı</label>
          <input
            name="name"
            required
            placeholder="Ör. Masa 7"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <button
          className="text-white rounded-lg px-4 py-2 font-medium shadow-md shadow-amber-600/20"
          style={{ background: "linear-gradient(135deg, #1D126D, #1D126D)" }}
        >
          Ekle
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {tablesWithQr.map((table) => (
          <div
            key={table.id}
            className="bg-white border rounded-2xl p-4 text-center space-y-2 transition-shadow hover:shadow-lg hover:shadow-black/5"
          >
            <p className="font-medium">{table.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={table.qrDataUrl}
              alt={`${table.name} QR kodu`}
              className="mx-auto"
            />
            <p className="text-xs text-gray-400 break-all">{table.url}</p>
            <div className="flex items-center justify-center gap-3 text-sm">
              <a
                href={table.qrPngUrl}
                download={`${table.name} QR.png`}
                className="underline"
              >
                PNG indir
              </a>
              <Link href={`/admin/masalar/yazdir?masa=${table.id}`} className="underline">
                Kartı yazdır
              </Link>
            </div>
            <Link
              href={`/admin/masalar/${table.id}`}
              className="inline-block text-sm text-white rounded-lg px-3 py-1.5 font-medium transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg, #1D126D, #1D126D)" }}
            >
              Hesabı yönet
            </Link>
            <div className="flex items-center justify-center gap-3 pt-1">
              <details className="relative">
                <summary className="text-sm underline cursor-pointer list-none">
                  Düzenle
                </summary>
                <form
                  action={updateTableAction}
                  className="absolute left-1/2 -translate-x-1/2 mt-2 bg-white border rounded-lg p-3 shadow-lg z-10 w-48 flex gap-2"
                >
                  <input type="hidden" name="id" value={table.id} />
                  <input
                    name="name"
                    defaultValue={table.name}
                    className="flex-1 border rounded-lg px-2 py-1 text-sm"
                  />
                  <button
                    className="text-sm text-white rounded-lg px-2 py-1"
                    style={{ background: "linear-gradient(135deg, #1D126D, #1D126D)" }}
                  >
                    Kaydet
                  </button>
                </form>
              </details>
              {table._count.orders === 0 ? (
                <form action={deleteTableAction}>
                  <input type="hidden" name="id" value={table.id} />
                  <ConfirmButton
                    message={`"${table.name}" masası silinsin mi? Bastırılmış QR kodu geçersiz olur.`}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Sil
                  </ConfirmButton>
                </form>
              ) : (
                <span
                  className="text-sm text-gray-300"
                  title="Geçmiş siparişi olan masa silinemez"
                >
                  Sil
                </span>
              )}
            </div>
          </div>
        ))}
        {tablesWithQr.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-6">
            Henüz masa eklenmedi.
          </p>
        )}
      </div>
    </div>
  );
}
