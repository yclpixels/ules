import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { readAdminSessionCookie } from "@/lib/session";

/**
 * JWT geçerli olsa bile personel kaydı veritabanında hâlâ aktif mi diye
 * bakılır: pasifleştirilen/silinen personel, cookie'si 30 gün daha geçerli
 * olsa da içeri giremez. `cache` sayesinde bir istek içinde tek sorgu atılır.
 */
export const verifyAdminSession = cache(async () => {
  const session = await readAdminSessionCookie();
  if (!session?.staffId) {
    redirect("/admin/login");
  }

  const staff = await prisma.staffUser.findUnique({
    where: { id: session.staffId },
    select: { isActive: true, role: true, branchId: true, name: true },
  });
  // Sayfa render'ı sırasında cookie silinemez (Next kısıtı); eski cookie
  // her istekte buraya takılıp login'e döner, kullanıcı tekrar giriş yapınca yenilenir.
  if (!staff || !staff.isActive) {
    redirect("/admin/login");
  }

  // Rol/isim/şube sonradan değişmiş olabilir; cookie'deki eski değeri değil
  // veritabanındaki güncel değeri kullan.
  return {
    ...session,
    role: staff.role,
    branchId: staff.branchId,
    name: staff.name,
  };
});

/** Sadece müdür rolüne izin verir; garson gelirse kasaya geri yönlendirir. */
export const verifyManagerSession = cache(async () => {
  const session = await verifyAdminSession();
  if (session.role !== "MANAGER") {
    redirect("/admin");
  }
  return session;
});
