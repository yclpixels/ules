import Link from "next/link";
import { logoutAction } from "@/lib/authActions";
import { verifyAdminSession } from "@/lib/dal";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifyAdminSession();
  const isManager = session.role === "MANAGER";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <span className="font-semibold">
            Masa QR Yönetim
            <span className="text-gray-400 font-normal"> · {session.branchName}</span>
          </span>
          <nav className="flex gap-4 text-sm flex-1">
            <Link href="/admin" className="text-gray-600 hover:text-black">
              Kasa
            </Link>
            {isManager && (
              <>
                <Link
                  href="/admin/siparisler"
                  className="text-gray-600 hover:text-black"
                >
                  Siparişler
                </Link>
                <Link
                  href="/admin/masalar"
                  className="text-gray-600 hover:text-black"
                >
                  Masalar
                </Link>
                <Link
                  href="/admin/urunler"
                  className="text-gray-600 hover:text-black"
                >
                  Ürünler
                </Link>
                <Link
                  href="/admin/personel"
                  className="text-gray-600 hover:text-black"
                >
                  Personel
                </Link>
                <Link
                  href="/admin/degerlendirmeler"
                  className="text-gray-600 hover:text-black"
                >
                  Değerlendirmeler
                </Link>
                <Link
                  href="/admin/ayarlar"
                  className="text-gray-600 hover:text-black"
                >
                  Ayarlar
                </Link>
              </>
            )}
          </nav>
          <Link
            href="/admin/hesabim"
            className="text-sm text-gray-500 hover:text-black"
          >
            {session.name} · {isManager ? "Müdür" : "Garson"}
          </Link>
          <form action={logoutAction}>
            <button className="text-sm text-gray-500 hover:text-black">
              Çıkış
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
