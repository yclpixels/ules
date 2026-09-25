import LoginForm from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border rounded-xl p-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Üleş</h1>
          <p className="text-sm text-gray-500">Personel girişi</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
