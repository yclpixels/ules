import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Logo className="w-9 h-9 shrink-0" />
          <h1 className="text-lg font-semibold">Personel girişi</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
