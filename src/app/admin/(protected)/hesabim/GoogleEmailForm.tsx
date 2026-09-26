"use client";

import { useActionState } from "react";
import { setOwnEmailAction, type OwnEmailState } from "@/lib/authActions";

export default function GoogleEmailForm({ email }: { email: string | null }) {
  const [state, action, pending] = useActionState<OwnEmailState, FormData>(
    setOwnEmailAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="text-sm text-gray-500">Google e-postası</label>
        <input
          type="email"
          name="email"
          defaultValue={email ?? ""}
          placeholder="ornek@gmail.com"
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Bağladığınızda giriş ekranında &quot;Google ile giriş yap&quot;ı kullanabilirsiniz. Boş
          bırakıp kaydederseniz bağlantı kaldırılır.
        </p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        style={{ background: "#1D126D" }}
      >
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
