"use client";

import { useActionState } from "react";
import {
  changeOwnPasswordAction,
  type ChangePasswordState,
} from "@/lib/authActions";

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState<
    ChangePasswordState,
    FormData
  >(changeOwnPasswordAction, undefined);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="text-sm text-gray-500">Mevcut şifre</label>
        <input
          type="password"
          name="currentPassword"
          required
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm text-gray-500">Yeni şifre</label>
        <input
          type="password"
          name="newPassword"
          required
          minLength={4}
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-600">Şifre değiştirildi.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Kaydediliyor..." : "Şifreyi Değiştir"}
      </button>
    </form>
  );
}
