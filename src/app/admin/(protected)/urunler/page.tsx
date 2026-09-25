import { prisma } from "@/lib/prisma";
import { formatTL } from "@/lib/money";
import {
  addCategoryAction,
  addProductAction,
  toggleProductAvailabilityAction,
  updateProductAction,
  deleteProductAction,
  updateCategoryAction,
  deleteCategoryAction,
  saveTranslationAction,
} from "@/lib/actions";
import { LOCALE_LABELS, parseLocales, pickTranslation } from "@/lib/locales";
import { verifyManagerSession } from "@/lib/dal";
import ConfirmButton from "@/components/ConfirmButton";
import ImagePicker from "@/components/ImagePicker";

const BRAND_GRADIENT = "linear-gradient(135deg, #E0233A, #E0233A)";

export const dynamic = "force-dynamic";

export default async function UrunlerPage() {
  const session = await verifyManagerSession();

  const branch = await prisma.branch.findUniqueOrThrow({
    where: { id: session.branchId },
    select: { supportedLocales: true },
  });
  // İlk dil ana dildir (temel alanlar); çeviri formu yalnızca diğerleri için.
  const [, ...extraLocales] = parseLocales(branch.supportedLocales);

  const categories = await prisma.category.findMany({
    where: { branchId: session.branchId },
    orderBy: { sortOrder: "asc" },
  });
  const products = await prisma.product.findMany({
    where: { branchId: session.branchId },
    orderBy: { name: "asc" },
    include: {
      category: true,
      translations: true,
      _count: { select: { orderItems: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <form
          action={addCategoryAction}
          className="flex gap-3 items-end"
        >
          <div className="flex-1">
            <label className="text-sm text-gray-500">Yeni kategori</label>
            <input
              name="name"
              required
              placeholder="Ör. İçecekler"
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
          <button
            className="text-white rounded-lg px-4 py-2 font-medium shadow-md shadow-amber-600/20"
            style={{ background: BRAND_GRADIENT }}
          >
            Ekle
          </button>
        </form>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((c) => (
              <details key={c.id} className="relative">
                <summary className="text-sm border rounded-full px-3 py-1 cursor-pointer list-none hover:bg-gray-50">
                  {c.name}
                </summary>
                <div className="absolute left-0 mt-2 bg-white border rounded-lg p-3 shadow-lg z-10 w-56 space-y-2">
                  <form action={updateCategoryAction} className="flex gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input
                      name="name"
                      defaultValue={c.name}
                      className="flex-1 border rounded-lg px-2 py-1 text-sm"
                    />
                    <input
                      name="sortOrder"
                      type="number"
                      defaultValue={c.sortOrder}
                      title="Sıra (küçük önce)"
                      className="w-14 border rounded-lg px-2 py-1 text-sm"
                    />
                    <button
                      className="text-sm text-white rounded-lg px-2 py-1"
                      style={{ background: BRAND_GRADIENT }}
                    >
                      Kaydet
                    </button>
                  </form>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmButton
                      message={`"${c.name}" kategorisi silinsin mi? İçindeki ürünler silinmez, "kategorisiz" olur.`}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Kategoriyi Sil
                    </ConfirmButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      <form
        action={addProductAction}
        className="bg-white border rounded-2xl p-4 flex gap-3 items-end flex-wrap"
      >
        <div className="flex-1 min-w-[160px]">
          <label className="text-sm text-gray-500">Ürün adı</label>
          <input
            name="name"
            required
            placeholder="Ör. Ayran"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <div className="w-32">
          <label className="text-sm text-gray-500">Fiyat (TL)</label>
          <input
            name="price"
            required
            placeholder="45.00"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="text-sm text-gray-500">Kategori</label>
          <select
            name="categoryId"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          >
            <option value="">Kategorisiz</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-500">Açıklama (opsiyonel)</label>
            <input
              name="description"
              placeholder="Ör. Közlenmiş biber ve domatesle"
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Alerjenler (opsiyonel)</label>
            <input
              name="allergens"
              placeholder="Ör. gluten, süt"
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Görsel (opsiyonel)</label>
            <div className="mt-1">
              <ImagePicker name="imageUrl" />
            </div>
          </div>
        </div>
        <button
          className="text-white rounded-lg px-4 py-2 font-medium shadow-md shadow-amber-600/20"
          style={{ background: BRAND_GRADIENT }}
        >
          Ürün Ekle
        </button>
      </form>

      <div className="bg-white border rounded-2xl divide-y overflow-hidden">
        {products.map((p) => (
          <div key={p.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-12 h-12 rounded-lg object-cover border shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p
                    className={`font-medium ${
                      !p.isAvailable ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {p.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {p.category?.name || "Kategorisiz"} —{" "}
                    {formatTL(p.priceCents)}
                  </p>
                  {p.description && (
                    <p className="text-xs text-gray-400 truncate">{p.description}</p>
                  )}
                  {p.allergens && (
                    <p className="text-xs text-amber-600">Alerjen: {p.allergens}</p>
                  )}
                  {extraLocales.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Çeviri:{" "}
                      {extraLocales
                        .map(
                          (code) =>
                            `${LOCALE_LABELS[code] || code}: ${
                              pickTranslation(p.translations, code)
                                ? "var"
                                : "yok"
                            }`
                        )
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {extraLocales.length > 0 && (
                  <details className="relative">
                    <summary className="text-sm underline cursor-pointer list-none">
                      Çeviriler
                    </summary>
                    <div className="absolute right-0 mt-2 bg-white border rounded-lg p-3 shadow-lg z-10 w-72 space-y-3">
                      {extraLocales.map((code) => {
                        const t = pickTranslation(p.translations, code);
                        return (
                          <form
                            key={code}
                            action={saveTranslationAction}
                            className="space-y-2 border-b last:border-b-0 pb-3 last:pb-0"
                          >
                            <input type="hidden" name="kind" value="product" />
                            <input type="hidden" name="targetId" value={p.id} />
                            <input type="hidden" name="locale" value={code} />
                            <p className="text-xs font-medium text-gray-500">
                              {LOCALE_LABELS[code] || code}
                            </p>
                            <input
                              name="name"
                              defaultValue={t?.name ?? ""}
                              placeholder="Ürün adı (boş = çeviriyi sil)"
                              className="w-full border rounded-lg px-2 py-1 text-sm"
                            />
                            <input
                              name="description"
                              defaultValue={t?.description ?? ""}
                              placeholder="Açıklama"
                              className="w-full border rounded-lg px-2 py-1 text-sm"
                            />
                            <input
                              name="allergens"
                              defaultValue={t?.allergens ?? ""}
                              placeholder="Alerjenler"
                              className="w-full border rounded-lg px-2 py-1 text-sm"
                            />
                            <button
                              className="w-full text-white rounded-lg py-1 text-sm"
                              style={{ background: BRAND_GRADIENT }}
                            >
                              Kaydet
                            </button>
                          </form>
                        );
                      })}
                    </div>
                  </details>
                )}
                <details className="relative">
                  <summary className="text-sm underline cursor-pointer list-none">
                    Düzenle
                  </summary>
                  <div className="absolute right-0 mt-2 bg-white border rounded-lg p-3 shadow-lg z-10 w-60 space-y-2">
                    <form action={updateProductAction} className="space-y-2">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="name"
                        defaultValue={p.name}
                        className="w-full border rounded-lg px-2 py-1 text-sm"
                      />
                      <input
                        name="price"
                        defaultValue={(p.priceCents / 100).toFixed(2)}
                        className="w-full border rounded-lg px-2 py-1 text-sm"
                      />
                      <select
                        name="categoryId"
                        defaultValue={p.categoryId ?? ""}
                        className="w-full border rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="">Kategorisiz</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <input
                        name="description"
                        defaultValue={p.description ?? ""}
                        placeholder="Açıklama"
                        className="w-full border rounded-lg px-2 py-1 text-sm"
                      />
                      <input
                        name="allergens"
                        defaultValue={p.allergens ?? ""}
                        placeholder="Alerjenler"
                        className="w-full border rounded-lg px-2 py-1 text-sm"
                      />
                      <ImagePicker name="imageUrl" defaultValue={p.imageUrl} />
                      <button
                        className="w-full text-white rounded-lg px-2 py-1 text-sm"
                        style={{ background: BRAND_GRADIENT }}
                      >
                        Kaydet
                      </button>
                    </form>
                    {p._count.orderItems === 0 ? (
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmButton
                          message={`"${p.name}" ürünü kalıcı olarak silinsin mi?`}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Ürünü Sil
                        </ConfirmButton>
                      </form>
                    ) : (
                      <p className="text-xs text-gray-400">
                        Siparişlerde kullanıldığı için silinemez — bunun
                        yerine tükendi işaretleyin.
                      </p>
                    )}
                  </div>
                </details>
                <form action={toggleProductAvailabilityAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input
                    type="hidden"
                    name="isAvailable"
                    value={String(p.isAvailable)}
                  />
                  <button className="text-sm underline">
                    {p.isAvailable ? "Tükendi işaretle" : "Tekrar aktif et"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500">
            Henüz ürün eklenmedi.
          </p>
        )}
      </div>
    </div>
  );
}
