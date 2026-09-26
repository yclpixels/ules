import "dotenv/config";
import { randomBytes, scryptSync } from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

/**
 * İlk müdürün şifresi. Yerel geliştirme veritabanında verilmezse bilinen bir
 * geliştirme şifresi kullanılır; başka her yerde (Railway vb.) SEED_MANAGER_PASSWORD
 * zorunlu. Eskiden her ortamda koda açıkça yazılı "degistir123"e düşüyordu.
 * Seed kendi bilgisayarınızdan canlı veritabanına karşı da çalıştırılabildiği
 * için NODE_ENV'e değil veritabanı adresine bakılır.
 */
function managerPassword(): string {
  const fromEnv = process.env.SEED_MANAGER_PASSWORD;
  if (fromEnv) {
    if (fromEnv.length < 8) {
      throw new Error("SEED_MANAGER_PASSWORD en az 8 karakter olmalı");
    }
    return fromEnv;
  }
  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").hostname;
    } catch {
      return "";
    }
  })();
  if (["localhost", "127.0.0.1", "::1"].includes(host)) {
    return "gelistirme123";
  }
  throw new Error(
    `SEED_MANAGER_PASSWORD tanımlı değil. Yerel olmayan veritabanında (${host || "bilinmiyor"}) varsayılan şifreyle hesap açılmaz.`
  );
}

async function main() {
  const branchName = process.env.SEED_BRANCH_NAME || "Ana Şube";
  const managerUsername = process.env.SEED_MANAGER_USERNAME || "yonetici";
  const existingManager = await prisma.staffUser.findUnique({
    where: { username: managerUsername },
    select: { id: true },
  });
  // Şifre kuralı, hiçbir şey yazılmadan önce kontrol edilir: aksi halde
  // şifre hatasında müdürsüz, yarım bir şube kalırdı.
  const newManagerPassword = existingManager ? null : managerPassword();
  // Menü adresi şube adından türetilir ("Kadıköy Şubesi" → kadikoy-subesi).
  // Eskiden her şubeye aynı sabit adres veriliyordu; ikinci şube seed'i
  // unique kısıtına takılıp hiç açılamıyordu. Adres doluysa boş bırakılır,
  // şube panelden kendi adresini seçer.
  const wantedSlug = process.env.SEED_MENU_SLUG || slugify(branchName);
  const slugTaken = await prisma.branch.findUnique({
    where: { menuSlug: wantedSlug },
    select: { id: true },
  });
  const menuSlug = slugTaken ? null : wantedSlug;
  let branch = await prisma.branch.findFirst({ where: { name: branchName } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: { name: branchName, menuSlug },
    });
    console.log(`Şube oluşturuldu: "${branch.name}"`);
  } else {
    console.log(`Şube zaten var: "${branch.name}"`);
    if (!branch.menuSlug && menuSlug) {
      // Menü sayfası (/menu/<slug>) ve pazarlama sitesindeki canlı önizleme
      // iframe'i menuSlug olmadan 404 verir — eski seed'lerde bu alan
      // ayarlanmamıştı.
      branch = await prisma.branch.update({
        where: { id: branch.id },
        data: { menuSlug },
      });
      console.log(`menuSlug eksikti, "${menuSlug}" olarak ayarlandı.`);
    }
  }

  if (existingManager) {
    // Mevcut hesabın şifresine dokunulmaz; eskiden burada yeni şifre
    // yazdırılıyordu ama hesap eski şifresiyle kalıyordu (yanıltıcı).
    console.log(`Müdür hesabı zaten var: "${managerUsername}" (şifresi değiştirilmedi)`);
  } else {
    await prisma.staffUser.create({
      data: {
        name: "Yönetici",
        username: managerUsername,
        passwordHash: hashPassword(newManagerPassword!),
        role: "MANAGER",
        branchId: branch.id,
      },
    });
    // Şifre günlüğe yazılmaz: Railway/CI günlükleri kalıcı ve paylaşılabilir.
    console.log(`Müdür hesabı oluşturuldu: "${managerUsername}"`);
  }

  const existingCategoryCount = await prisma.category.count({
    where: { branchId: branch.id },
  });
  if (existingCategoryCount === 0) {
    const anaYemekler = await prisma.category.create({
      data: { name: "Ana Yemekler", sortOrder: 1, branchId: branch.id },
    });
    const icecekler = await prisma.category.create({
      data: { name: "İçecekler", sortOrder: 2, branchId: branch.id },
    });
    const tatlilar = await prisma.category.create({
      data: { name: "Tatlılar", sortOrder: 3, branchId: branch.id },
    });

    await prisma.product.createMany({
      data: [
        {
          name: "Adana Kebap",
          priceCents: 32000,
          categoryId: anaYemekler.id,
          branchId: branch.id,
        },
        {
          name: "Izgara Köfte",
          priceCents: 28000,
          categoryId: anaYemekler.id,
          branchId: branch.id,
        },
        {
          name: "Karışık Pizza",
          priceCents: 25000,
          categoryId: anaYemekler.id,
          branchId: branch.id,
        },
        {
          name: "Ayran",
          priceCents: 4500,
          categoryId: icecekler.id,
          branchId: branch.id,
        },
        {
          name: "Kola",
          priceCents: 5000,
          categoryId: icecekler.id,
          branchId: branch.id,
        },
        {
          name: "Türk Kahvesi",
          priceCents: 6000,
          categoryId: icecekler.id,
          branchId: branch.id,
        },
        {
          name: "Künefe",
          priceCents: 12000,
          categoryId: tatlilar.id,
          branchId: branch.id,
        },
        {
          name: "Sütlaç",
          priceCents: 9000,
          categoryId: tatlilar.id,
          branchId: branch.id,
        },
      ],
    });
    console.log("Örnek kategori/ürünler eklendi.");
  } else {
    console.log("Kategori/ürünler zaten var, atlandı.");
  }

  const existingTableCount = await prisma.table.count({
    where: { branchId: branch.id },
  });
  if (existingTableCount === 0) {
    await prisma.table.createMany({
      data: [
        { name: "Masa 1", branchId: branch.id },
        { name: "Masa 2", branchId: branch.id },
        { name: "Masa 3", branchId: branch.id },
        { name: "Masa 4", branchId: branch.id },
      ],
    });
    console.log("Örnek masalar eklendi.");
  } else {
    console.log("Masalar zaten var, atlandı.");
  }

  console.log("Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
