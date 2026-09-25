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
/**
 * Oturumu döner, yoksa null — yönlendirme YAPMAZ.
 * Route handler'larda bunu kullanın: orada `redirect()` bir istisna fırlatır
 * ve gerçek hatalarla karışıp yanıltıcı 401'lere yol açar.
 */
export const getAdminSession = cache(async () => {
  const session = await readAdminSessionCookie();
  if (!session?.staffId) return null;

  const staff = await prisma.staffUser.findUnique({
    where: { id: session.staffId },
    select: {
      isActive: true,
      role: true,
      branchId: true,
      name: true,
      sessionVersion: true,
    },
  });
  if (!staff || !staff.isActive) return null;
  // Şifre değişti/sıfırlandı ya da hesap pasifleşip tekrar açıldıysa bu
  // cihazdaki eski oturum artık geçersiz (JWT'nin 30 günü dolmamış olsa bile).
  if ((session.sv ?? 0) !== staff.sessionVersion) return null;

  // Rol/isim/şube sonradan değişmiş olabilir; cookie'deki eski değeri değil
  // veritabanındaki güncel değeri kullan.
  return {
    ...session,
    role: staff.role,
    branchId: staff.branchId,
    name: staff.name,
  };
});

export const verifyAdminSession = cache(async () => {
  const session = await getAdminSession();
  // Sayfa render'ı sırasında cookie silinemez (Next kısıtı); eski cookie
  // her istekte buraya takılıp login'e döner, kullanıcı tekrar giriş yapınca yenilenir.
  if (!session) {
    redirect("/admin/login");
  }
  return session;
});

/**
 * Müdür yetkisi gerektiren sayfalar. OWNER (platform sahibi) kendi şubesinde
 * müdür sayılır — ama şube filtresi değişmez, o da yalnızca kendi şubesinin
 * verisini görür. Şubeler arası görünüm sadece `verifyOwnerSession` ile
 * korunan sahip paneline özeldir.
 */
export const verifyManagerSession = cache(async () => {
  const session = await verifyAdminSession();
  if (session.role !== "MANAGER" && session.role !== "OWNER") {
    redirect("/admin");
  }
  return session;
});

/**
 * Platform sahibi (biz). Tüm şubeleri görebilen tek rol; sadece sahip
 * panelinde kullanılır, şubeye bağlı sayfalar bundan etkilenmez.
 */
export const verifyOwnerSession = cache(async () => {
  const session = await verifyAdminSession();
  if (session.role !== "OWNER") {
    redirect("/admin");
  }
  return session;
});
