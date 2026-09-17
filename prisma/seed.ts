import "dotenv/config";
import { randomBytes, scryptSync } from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const branchName = process.env.SEED_BRANCH_NAME || "Ana Şube";
  let branch = await prisma.branch.findFirst({ where: { name: branchName } });
  if (!branch) {
    branch = await prisma.branch.create({ data: { name: branchName } });
    console.log(`Şube oluşturuldu: "${branch.name}"`);
  } else {
    console.log(`Şube zaten var: "${branch.name}"`);
  }

  const managerUsername = process.env.SEED_MANAGER_USERNAME || "yonetici";
  const managerPassword = process.env.SEED_MANAGER_PASSWORD || "degistir123";
  await prisma.staffUser.upsert({
    where: { username: managerUsername },
    update: {},
    create: {
      name: "Yönetici",
      username: managerUsername,
      passwordHash: hashPassword(managerPassword),
      role: "MANAGER",
      branchId: branch.id,
    },
  });
  console.log(
    `Müdür hesabı hazır → kullanıcı adı: "${managerUsername}", şifre: "${managerPassword}" (giriş sonrası değiştirin)`
  );

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
