import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";
import SupportForm from "./SupportForm";

export const dynamic = "force-dynamic";

/** Müdür ve garsonun bize (platforma) destek talebi gönderdiği sayfa. */
export default async function DestekPage() {
  const session = await verifyAdminSession();
  const branch = await prisma.branch.findUniqueOrThrow({
    where: { id: session.branchId },
    select: { contactEmail: true, contactPhone: true },
  });

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold">Destek</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bir sorun mu var ya da bir şey mi soracaksınız? Yazın, size dönelim.
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <SupportForm defaultContact={branch.contactEmail ?? branch.contactPhone ?? ""} />
      </div>

      <p className="text-sm text-gray-500">
        Doğrudan e-posta da atabilirsiniz:{" "}
        <a href={PUBLIC_SUPPORT_MAILTO} className="underline text-gray-700">
          {PUBLIC_SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}
