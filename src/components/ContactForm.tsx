"use client";

import { useActionState } from "react";
import { sendContactRequestAction, type ContactRequestState } from "@/lib/actions";

export default function ContactForm() {
  const [state, formAction, pending] = useActionState<
    ContactRequestState,
    FormData
  >(sendContactRequestAction, undefined);

  if (state?.success) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center shadow-xl shadow-black/5">
        <p className="font-semibold">Teşekkürler, talebiniz alındı.</p>
        <p className="text-sm text-gray-500 mt-1">
          En kısa sürede size dönüş yapacağız.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-white rounded-2xl p-6 space-y-4 shadow-xl shadow-black/5">
      {/* Bot tuzağı: gerçek kullanıcı görmez/doldurmaz */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <label className="text-sm text-gray-500">İşletme adı</label>
        <input
          name="businessName"
          required
          placeholder="Ör. Sahil Cafe"
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm text-gray-500">E-posta veya telefon</label>
        <input
          name="contact"
          required
          placeholder="ornek@eposta.com veya 05xx..."
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm text-gray-500">Mesaj (opsiyonel)</label>
        <textarea
          name="message"
          rows={3}
          placeholder="Kaç masa, hangi şehir vb. kısaca yazabilirsiniz"
          className="w-full mt-1 border rounded-lg px-3 py-2"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        disabled={pending}
        className="w-full rounded-lg px-4 py-3 font-medium text-white shadow-lg shadow-amber-600/20 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        style={{ background: "linear-gradient(135deg, #fbbf24, #f87171)" }}
      >
        {pending ? "Gönderiliyor..." : "Demo İsteyin"}
      </button>
    </form>
  );
}
