"use client";

import { useActionState, useState } from "react";
import {
  createBranchAction,
  type CreateBranchState,
} from "@/lib/actions";

const BRAND_GRADIENT = "linear-gradient(135deg, #1D126D, #1D126D)";

/**
 * Yeni işletme açma formu. Katlanabilir: sahip panelinin ana işi mevcut
 * işletmeleri izlemek, yeni açmak ara sıra yapılan bir iş.
 */
export default function NewBranchForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    CreateBranchState,
    FormData
  >(createBranchAction, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-white rounded-lg px-4 py-2 text-sm font-medium shadow-md shadow-amber-600/20"
        style={{ background: BRAND_GRADIENT }}
      >
        + Yeni işletme aç
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="bg-white border rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Yeni işletme</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          Kapat
        </button>
      </div>

      <div>
        <label className="text-sm text-gray-500">İşletme adı</label>
        <input
          name="name"
          required
          placeholder="Ör. Kadıköy Şubesi"
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>

      <p className="text-xs text-gray-400">
        Bu işletmenin ilk müdür hesabı. Şifreyi kendisine iletin, giriş yapınca
        &quot;Hesabım&quot;dan değiştirebilir. Örnek ürün/masa oluşturulmaz —
        menüyü müdür kendisi girer.
      </p>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <label className="text-sm text-gray-500">Müdür adı</label>
          <input
            name="managerName"
            required
            placeholder="Ahmet Yılmaz"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-sm text-gray-500">Kullanıcı adı</label>
          <input
            name="username"
            required
            placeholder="kadikoy_mudur"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-sm text-gray-500">Şifre</label>
          <input
            name="password"
            type="text"
            required
            minLength={6}
            placeholder="en az 6 karakter"
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-600">{state.success}</p>
      )}

      <button
        disabled={pending}
        className="text-white rounded-lg px-4 py-2 text-sm font-medium shadow-md shadow-amber-600/20 disabled:opacity-50"
        style={{ background: BRAND_GRADIENT }}
      >
        {pending ? "Açılıyor..." : "İşletmeyi Aç"}
      </button>
    </form>
  );
}
