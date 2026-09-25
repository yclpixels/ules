import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8 shrink-0" />
          <div>
            <h1 className="text-lg font-semibold">Üleş</h1>
            <p className="text-sm text-gray-500">Personel girişi</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
