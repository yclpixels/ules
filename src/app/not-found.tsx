import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <Logo className="w-10 h-10 mx-auto" />
        <p className="text-lg font-semibold">Sayfa bulunamadı</p>
        <p className="text-sm text-gray-500">
          QR kodu yeniden okutmayı deneyin.
        </p>
        <Link href="/" className="text-sm underline text-gray-600">
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
