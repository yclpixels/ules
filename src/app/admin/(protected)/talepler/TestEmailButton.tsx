"use client";

import { useActionState } from "react";
import { sendTestEmailAction, type TestEmailState } from "@/lib/actions";

/** SUPPORT_EMAIL'e deneme e-postası; gitmezse sebebini olduğu gibi gösterir. */
export default function TestEmailButton({ inbox }: { inbox: string | null }) {
  const [state, action, pending] = useActionState<TestEmailState, FormData>(
    sendTestEmailAction,
    undefined
  );

  return (
    <form action={action} className="bg-white border rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <p className="font-medium">E-posta bildirimi</p>
          <p className="text-gray-500">
            Talepler şu adrese gelir: <strong>{inbox ?? "tanımlı değil"}</strong>
          </p>
        </div>
        <button
          disabled={pending}
          className="h-11 rounded-lg border px-4 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {pending ? "Gönderiliyor..." : "Deneme e-postası gönder"}
        </button>
      </div>
      {state?.ok && <p className="text-sm text-green-700">{state.ok}</p>}
      {state?.error && <p className="text-sm text-red-600 break-words">{state.error}</p>}
    </form>
  );
}
