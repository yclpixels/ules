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
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm text-gray-500">Şifre</label>
        <input
          type="password"
          name="password"
          required
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-black text-white rounded-lg py-2 font-medium disabled:opacity-50"
      >
        {pending ? "Giriş yapılıyor..." : "Giriş yap"}
      </button>
    </form>
  );
}
