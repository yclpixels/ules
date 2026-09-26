import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";
import { isGoogleLoginEnabled } from "@/lib/googleAuth";

export const metadata: Metadata = { title: "Personel girişi" };

// Google ayarı runtime'da okunur (build'e gömülmesin).
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  "google-hesap-yok":
    "Bu Google hesabı hiçbir aktif personel hesabına bağlı değil. Müdürünüzden e-postanızı Personel sayfasından eklemesini isteyin ya da kullanıcı adınızla girip Hesabım'dan bağlayın.",
  "google-iptal": "Google ile giriş iptal edildi.",
  "google-hata": "Google ile giriş tamamlanamadı, lütfen tekrar deneyin.",
  "google-kapali": "Google ile giriş bu işletmede henüz açık değil.",
  "cok-deneme": "Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const { hata } = await searchParams;
  const googleEnabled = isGoogleLoginEnabled();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(60% 50% at 80% 0%, rgba(124,108,255,0.35), transparent 70%), #1D126D",
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 shrink-0" />
          <h1 className="text-xl font-bold">Personel girişi</h1>
        </div>

        {hata && ERRORS[hata] && (
          <p role="alert" className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
            {ERRORS[hata]}
          </p>
        )}

        {googleEnabled && (
          <>
            {/* Düz <a>: OAuth yönlendirmesi tam sayfa geçişi olmalı. */}
            <a
              href="/api/auth/google"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border font-medium hover:bg-gray-50"
            >
              <GoogleIcon />
              Google ile giriş yap
            </a>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              veya kullanıcı adıyla
              <span className="h-px flex-1 bg-gray-200" />
            </div>
          </>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
