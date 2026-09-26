import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { prisma } from "@/lib/prisma";
import { verifyManagerSession } from "@/lib/dal";
import { roleLabel } from "@/lib/roles";
import ConfirmButton from "@/components/ConfirmButton";
import {
  addStaffAction,
  toggleStaffActiveAction,
  resetStaffPasswordAction,
} from "@/lib/authActions";

const BRAND_GRADIENT = "linear-gradient(135deg, #1D126D, #1D126D)";

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
      <div>
        <h1 className="text-xl font-semibold">Personel</h1>
        <p className="text-sm text-gray-500">Hesap ekleme, şifre sıfırlama ve pasifleştirme</p>
      </div>
      {hata === "kullanici-mevcut" && (
        <p className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
          Bu kullanıcı adı zaten kullanılıyor — başka bir tane deneyin.
        </p>
      )}
      <form
        action={addStaffAction}
        className="bg-white border rounded-2xl p-4 flex gap-3 items-end flex-wrap"
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
            minLength={MIN_PASSWORD_LENGTH}
            placeholder={`en az ${MIN_PASSWORD_LENGTH} karakter`}
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
        <button
          className="text-white rounded-lg px-4 py-2 font-medium shadow-md shadow-amber-600/20"
          style={{ background: BRAND_GRADIENT }}
        >
          Ekle
        </button>
      </form>

      {/* overflow-hidden yok: son satırın "Şifre Sıfırla" kutusu kesiliyordu. */}
      <div className="bg-white border rounded-2xl divide-y">
        {staff.map((s) => (
          <div key={s.id} className="relative px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ background: BRAND_GRADIENT }}
                >
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p
                    className={`font-medium ${
                      !s.isActive ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {s.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{s.username} ·{" "}
                    <span className="inline-block text-xs rounded-full px-2 py-0.5 bg-amber-50 text-amber-700">
                      {roleLabel(s.role)}
                    </span>
                  </p>
                </div>
              </div>
              {/* Sahip hesabını yalnızca sahip yönetir (bkz. manageableStaffFilter). */}
              {session.role !== "OWNER" && s.role === "OWNER" ? (
                <span className="text-xs text-gray-400 shrink-0">Platform hesabı</span>
              ) : (
              <div className="flex items-center gap-3 shrink-0">
                <details className="sm:relative">
                  <summary className="text-sm underline cursor-pointer list-none h-10 inline-flex items-center">
                    Şifre Sıfırla
                  </summary>
                  <form
                    action={resetStaffPasswordAction}
                    className="absolute left-3 right-3 sm:left-auto sm:right-0 mt-2 bg-white border rounded-lg p-3 shadow-lg z-10 flex gap-2 items-end sm:w-64"
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
                        minLength={MIN_PASSWORD_LENGTH}
                        className="w-full mt-1 border rounded-lg px-2 py-1 text-sm"
                      />
                    </div>
                    <button
                      className="text-white rounded-lg px-3 py-1 text-sm"
                      style={{ background: BRAND_GRADIENT }}
                    >
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
                      className="text-sm underline h-10"
                    >
                      {s.isActive ? "Pasifleştir" : "Aktif et"}
                    </ConfirmButton>
                  </form>
                )}
              </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
