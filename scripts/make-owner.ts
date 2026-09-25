/**
 * Bir personel hesabını platform sahibi (OWNER) yapar.
 *
 * OWNER; kendi şubesinde müdür yetkilerine ek olarak tüm işletmeleri
 * (/admin/isletmeler) ve demo/destek taleplerini (/admin/talepler) görür.
 * Seed yalnızca MANAGER açtığı ve panelde rol yükseltme ekranı bilerek
 * olmadığı için (bir müdür kendini sahip yapamasın) bu iş komutla yapılır.
 *
 * Kullanım (DATABASE_URL hangi veritabanını gösteriyorsa ona yazar):
 *   npm run make-owner -- <kullanici_adi>
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const username = process.argv[2]?.trim().toLowerCase();
  if (!username) {
    console.error("Kullanım: npm run make-owner -- <kullanici_adi>");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const staff = await prisma.staffUser.findUnique({
      where: { username },
      include: { branch: { select: { name: true } } },
    });
    if (!staff) {
      console.error(`"${username}" adında bir personel yok.`);
      process.exit(1);
    }
    if (staff.role === "OWNER") {
      console.log(`"${username}" zaten sahip (OWNER).`);
      return;
    }

    await prisma.staffUser.update({
      where: { id: staff.id },
      // Oturum sürümü artırılır: yeni rolün menüsü bir sonraki girişte gelsin,
      // eski oturum kalmasın.
      data: { role: "OWNER", sessionVersion: { increment: 1 } },
    });
    await prisma.auditLog.create({
      data: {
        branchId: staff.branchId,
        action: "STAFF_ROLE_CHANGED",
        actorName: "Komut satırı (make-owner)",
        detail: `${staff.name} (${username}): ${staff.role} → OWNER`,
      },
    });
    console.log(
      `"${username}" (${staff.branch.name}) artık platform sahibi. Çıkış yapıp tekrar giriş yapın.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main();
