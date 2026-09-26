import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Menü verisi (kategoriler + satıştaki ürünler + çeviriler) ÖNBELLEKTE.
 *
 * Müşteri ekranı hesabı 4 sn'de bir yeniler; menüyü her seferinde
 * veritabanından okumak hem yavaş (uzak DB'de gidiş-dönüş ~150 ms) hem
 * gereksizdi — menü günde birkaç kez değişir. Menüyü değiştiren her işlem
 * `menuChanged()` çağırır; önbellek anında boşalır, "tükendi" işaretlenen
 * ürün bir sonraki yenilemede müşteri ekranından kalkar. `revalidate` yalnızca
 * gözden kaçan bir değişikliğe karşı emniyet.
 *
 * Yalnızca düz alanlar seçilir (Date yok): önbellek JSON'a çevirerek saklar.
 */
export function menuTag(branchId: string) {
  return `menu:${branchId}`;
}

const productSelect = {
  id: true,
  name: true,
  priceCents: true,
  description: true,
  allergens: true,
  imageUrl: true,
  translations: { select: { locale: true, name: true, description: true, allergens: true } },
} as const;

async function loadMenu(branchId: string) {
  const [categories, uncategorized] = await Promise.all([
    prisma.category.findMany({
      where: { branchId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        translations: { select: { locale: true, name: true } },
        products: {
          where: { isAvailable: true },
          orderBy: { name: "asc" },
          select: productSelect,
        },
      },
    }),
    prisma.product.findMany({
      where: { isAvailable: true, categoryId: null, branchId },
      orderBy: { name: "asc" },
      select: productSelect,
    }),
  ]);
  return { categories: categories.filter((c) => c.products.length > 0), uncategorized };
}

export type MenuData = Awaited<ReturnType<typeof loadMenu>>;
export type MenuDataProduct = MenuData["uncategorized"][number];

export function getMenuData(branchId: string): Promise<MenuData> {
  return unstable_cache(loadMenu, ["menu-data", branchId], {
    tags: [menuTag(branchId)],
    revalidate: 300,
  })(branchId);
}
