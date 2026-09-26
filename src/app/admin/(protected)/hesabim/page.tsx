import { verifyAdminSession } from "@/lib/dal";
import { roleLabel } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import ChangePasswordForm from "./ChangePasswordForm";
import GoogleEmailForm from "./GoogleEmailForm";

export const dynamic = "force-dynamic";

export default async function HesabimPage() {
  const session = await verifyAdminSession();
  const me = await prisma.staffUser.findUnique({
    where: { id: session.staffId },
    select: { email: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hesabım</h1>
        <p className="text-sm text-gray-500">Kendi bilgileriniz ve şifreniz</p>
      </div>
      <div className="bg-white border rounded-2xl p-4">
        <p className="font-medium">{session.name}</p>
        <p className="text-sm text-gray-500">
          {session.branchName} ·{" "}
          {roleLabel(session.role)}
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-3 max-w-sm">
        <p className="text-sm font-medium">Google ile giriş</p>
        <GoogleEmailForm email={me?.email ?? null} />
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-3 max-w-sm">
        <p className="text-sm font-medium">Şifre Değiştir</p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
