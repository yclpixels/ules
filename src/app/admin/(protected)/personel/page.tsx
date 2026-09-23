import { prisma } from "@/lib/prisma";
import { verifyManagerSession } from "@/lib/dal";
import { roleLabel } from "@/lib/roles";
import ConfirmButton from "@/components/ConfirmButton";
import {
  addStaffAction,
  toggleStaffActiveAction,
  resetStaffPasswordAction,
} from "@/lib/authActions";

export const dynamic = "force-dynamic";

export default async function PersonelPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const session = await verifyManagerSession();
  const { hata } = await searchParams;

  const staff = await prisma.staffUser.findMany({
    where: { branchId: session.branchId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      {hata === "kullanici-mevcut" && (
        <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          Bu kullanıcı adı zaten kullanılıyor — başka bir tane deneyin.
        </p>
      )}
      <form
        action={addStaffAction}
        className="bg-white border rounded-xl p-4 flex gap-3 items-end flex-wrap"
      >
        <div className="min-w-[140px]">
          <label className="text-sm text-gray-500">Ad Soyad</label>
          <input
            name="name"
            required
            placeholder="Ör. Ahmet Yılmaz"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="text-sm text-gray-500">Kullanıcı adı</label>
          <input
            name="username"
            required
            placeholder="ahmet"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="text-sm text-gray-500">Şifre</label>
          <input
            name="password"
            type="text"
            required
            minLength={4}
            placeholder="en az 4 karakter"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="text-sm text-gray-500">Rol</label>
          <select
            name="role"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          >
            <option value="WAITER">Garson</option>
            <option value="MANAGER">Müdür</option>
          </select>
        </div>
        <button className="bg-black text-white rounded-lg px-4 py-2 font-medium">
          Ekle
        </button>
      </form>

      <div className="bg-white border rounded-xl divide-y">
        {staff.map((s) => (
          <div key={s.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`font-medium ${
                    !s.isActive ? "line-through text-gray-400" : ""
                  }`}
                >
                  {s.name}{" "}
                  <span className="text-sm text-gray-500">
                    @{s.username} · {roleLabel(s.role)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <details className="relative">
                  <summary className="text-sm underline cursor-pointer list-none">
                    Şifre Sıfırla
                  </summary>
                  <form
                    action={resetStaffPasswordAction}
                    className="absolute right-0 mt-2 bg-white border rounded-lg p-3 shadow-lg z-10 flex gap-2 items-end w-64"
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">
                        Yeni şifre
                      </label>
                      <input
                        name="newPassword"
                        type="text"
                        required
                        minLength={4}
                        className="w-full mt-1 border rounded-lg px-2 py-1 text-sm"
                      />
                    </div>
                    <button className="bg-black text-white rounded-lg px-3 py-1 text-sm">
                      Kaydet
                    </button>
                  </form>
                </details>
                {s.id !== session.staffId && (
                  <form action={toggleStaffActiveAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      type="hidden"
                      name="isActive"
                      value={String(s.isActive)}
                    />
                    <ConfirmButton
                      message={
                        s.isActive
                          ? `${s.name} pasifleştirilsin mi? Açık oturumu anında düşer.`
                          : `${s.name} tekrar aktif edilsin mi?`
                      }
                      className="text-sm underline"
                    >
                      {s.isActive ? "Pasifleştir" : "Aktif et"}
                    </ConfirmButton>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
