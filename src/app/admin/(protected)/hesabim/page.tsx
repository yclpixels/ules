import { verifyAdminSession } from "@/lib/dal";
import { roleLabel } from "@/lib/roles";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function HesabimPage() {
  const session = await verifyAdminSession();

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-4">
        <p className="font-medium">{session.name}</p>
        <p className="text-sm text-gray-500">
          {session.branchName} ·{" "}
          {roleLabel(session.role)}
        </p>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-3 max-w-sm">
        <p className="text-sm font-medium">Şifre Değiştir</p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
