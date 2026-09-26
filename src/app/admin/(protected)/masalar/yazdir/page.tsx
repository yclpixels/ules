import QRCode from "qrcode";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/baseUrl";
import { byNaturalName } from "@/lib/money";
import { verifyManagerSession } from "@/lib/dal";
import Logo from "@/components/Logo";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

/**
 * Masalara konacak QR kartları — A4'e 6 kart (2×3), kesim için kesikli
 * çerçeve. QR vektör (SVG) basılır: hangi boyutta basılırsa basılsın keskin
 * kalır, telefon kamerası uzaktan da okur. Kartta menü/hesap için ne
 * yapılacağı yazar; müşteri QR'ın ne işe yaradığını bilmeden okutmaz.
 */
export default async function QrYazdirPage({
  searchParams,
}: {
  searchParams: Promise<{ masa?: string }>;
}) {
  const session = await verifyManagerSession();
  const { masa } = await searchParams;

  const [branch, tables] = await Promise.all([
    prisma.branch.findUniqueOrThrow({
      where: { id: session.branchId },
      select: { name: true },
    }),
    prisma.table.findMany({
      // ?masa=<id> ile tek masanın kartı (yenisi eklendiğinde / kart yıprandığında).
      where: { branchId: session.branchId, ...(masa ? { id: masa } : {}) },
    }),
  ]);
  tables.sort(byNaturalName);
  const baseUrl = await getBaseUrl();

  const cards = await Promise.all(
    tables.map(async (t) => ({
      id: t.id,
      name: t.name,
      // Kendi ürettiğimiz SVG; kullanıcı girdisi içermez (sadece URL).
      svg: await QRCode.toString(`${baseUrl}/masa/${t.qrToken}`, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
      }),
    }))
  );

  return (
    <div className="space-y-4">
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          header { display: none !important; }
          main { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .qr-toolbar { display: none !important; }
          .qr-sheet { gap: 6mm !important; }
          .qr-card { height: 88mm; border-color: #999 !important; }
        }
      `}</style>

      <div className="qr-toolbar flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">QR kartlarını yazdır</h1>
          <p className="text-sm text-gray-500">
            {cards.length} kart · A4 sayfaya 6 kart sığar. Kesikli çizgiden kesip
            masalara koyun.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/masalar"
            className="h-11 inline-flex items-center rounded-lg border px-4 text-sm"
          >
            Masalara dön
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="qr-sheet grid grid-cols-2 gap-4">
        {cards.map((c) => (
          <div
            key={c.id}
            className="qr-card break-inside-avoid rounded-2xl border-2 border-dashed border-gray-300 bg-white p-5 flex flex-col items-center justify-between text-center"
          >
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-sm text-gray-500">{branch.name}</span>
            </div>
            <p className="text-3xl font-bold tracking-tight my-2">{c.name}</p>
            <div
              className="w-[44mm] h-[44mm] [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: c.svg }}
            />
            <p className="text-sm font-medium mt-3">
              Menü, sipariş ve hesap için okutun
            </p>
            <p className="text-xs text-gray-500">
              Telefonunuzun kamerasını açıp koda tutun — uygulama gerekmez.
            </p>
          </div>
        ))}
        {cards.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-6">
            Henüz masa yok. Önce Masalar sayfasından masa ekleyin.
          </p>
        )}
      </div>
    </div>
  );
}
