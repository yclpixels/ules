"use client";

import { useActionState } from "react";
import { sendSupportRequestAction, type SupportFormState } from "@/lib/actions";

export default function SupportForm({ defaultContact }: { defaultContact: string }) {
  const [state, action, pending] = useActionState<SupportFormState, FormData>(
    sendSupportRequestAction,
    undefined
  );

  if (state?.success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-sm">
        Talebiniz bize ulaştı. En kısa sürede size dönüş yapacağız.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="text-sm text-gray-500">Konu</label>
        <input
          name="subject"
          required
          maxLength={150}
          placeholder="Ör. QR kod okunmuyor, yeni masa eklenemiyor"
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm text-gray-500">Mesaj</label>
        <textarea
          name="message"
          required
          rows={5}
          maxLength={4000}
          placeholder="Ne oldu, hangi ekranda, ne zaman? Ayrıntı ne kadar çoksa çözüm o kadar hızlı."
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm text-gray-500">Size nasıl ulaşalım?</label>
        <input
          name="contact"
          defaultValue={defaultContact}
          maxLength={200}
          placeholder="ornek@gmail.com veya 0555 123 45 67"
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        style={{ background: "#1D126D" }}
      >
        {pending ? "Gönderiliyor..." : "Destek talebi gönder"}
      </button>
    </form>
  );
}
