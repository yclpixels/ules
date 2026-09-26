"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/authActions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  );

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="text-sm text-gray-500">Kullanıcı adı</label>
        <input
          type="text"
          name="username"
          required
          autoFocus
          autoCapitalize="none"
          className="w-full mt-1 h-12 border rounded-xl px-3"
        />
      </div>
      <div>
        <label className="text-sm text-gray-500">Şifre</label>
        <input
          type="password"
          name="password"
          required
          className="w-full mt-1 h-12 border rounded-xl px-3"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 text-white rounded-xl font-semibold disabled:opacity-50"
        style={{ background: "#1D126D" }}
      >
        {pending ? "Giriş yapılıyor..." : "Giriş yap"}
      </button>
    </form>
  );
}
