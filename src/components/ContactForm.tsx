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
      <div
        className="rounded-3xl p-8 text-center shadow-2xl"
        style={{ backgroundColor: "#ffffff", color: "#08061A" }}
      >
        <p className="font-semibold">Teşekkürler, talebiniz alındı.</p>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          En kısa sürede size dönüş yapacağız.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl"
      style={{ backgroundColor: "#ffffff", color: "#08061A" }}
    >
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
        <label className="text-sm font-medium" style={{ color: "#5B5B72" }}>
          İşletme adı
        </label>
        <input
          name="businessName"
          required
          placeholder="Ör. Sahil Cafe"
          className="w-full mt-1.5 rounded-xl px-4 py-3 outline-none transition-shadow focus:ring-2 focus:ring-[#7C6CFF]"
          style={{ border: "1px solid #E7E5F4", background: "#F7F6FC" }}
        />
      </div>

      <div>
        <label className="text-sm font-medium" style={{ color: "#5B5B72" }}>
          E-posta veya telefon
        </label>
        <input
          name="contact"
          required
          placeholder="ornek@eposta.com veya 05xx..."
          className="w-full mt-1.5 rounded-xl px-4 py-3 outline-none transition-shadow focus:ring-2 focus:ring-[#7C6CFF]"
          style={{ border: "1px solid #E7E5F4", background: "#F7F6FC" }}
        />
      </div>

      <div>
        <label className="text-sm font-medium" style={{ color: "#5B5B72" }}>
          Mesaj (opsiyonel)
        </label>
        <textarea
          name="message"
          rows={3}
          placeholder="Kaç masa, hangi şehir vb. kısaca yazabilirsiniz"
          className="w-full mt-1.5 rounded-xl px-4 py-3 outline-none transition-shadow focus:ring-2 focus:ring-[#7C6CFF]"
          style={{ border: "1px solid #E7E5F4", background: "#F7F6FC" }}
        />
      </div>

      {state?.error && (
        <p className="text-sm" style={{ color: "#dc2626" }}>
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-full px-4 py-3.5 font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        style={{ backgroundColor: "#1D126D" }}
      >
        {pending ? "Gönderiliyor..." : "Demo İsteyin"}
      </button>
    </form>
  );
}
