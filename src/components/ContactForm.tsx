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
        className="rounded-2xl p-6 text-center"
        style={{ backgroundColor: "#ffffff", border: "1px solid #eeeeee" }}
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
      className="rounded-2xl p-6 space-y-4"
      style={{ backgroundColor: "#ffffff", border: "1px solid #eeeeee" }}
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
        <label className="text-sm" style={{ color: "#6b7280" }}>
          İşletme adı
        </label>
        <input
          name="businessName"
          required
          placeholder="Ör. Sahil Cafe"
          className="w-full mt-1 rounded-lg px-3 py-2"
          style={{ border: "1px solid #e5e7eb" }}
        />
      </div>

      <div>
        <label className="text-sm" style={{ color: "#6b7280" }}>
          E-posta veya telefon
        </label>
        <input
          name="contact"
          required
          placeholder="ornek@eposta.com veya 05xx..."
          className="w-full mt-1 rounded-lg px-3 py-2"
          style={{ border: "1px solid #e5e7eb" }}
        />
      </div>

      <div>
        <label className="text-sm" style={{ color: "#6b7280" }}>
          Mesaj (opsiyonel)
        </label>
        <textarea
          name="message"
          rows={3}
          placeholder="Kaç masa, hangi şehir vb. kısaca yazabilirsiniz"
          className="w-full mt-1 rounded-lg px-3 py-2"
          style={{ border: "1px solid #e5e7eb" }}
        />
      </div>

      {state?.error && (
        <p className="text-sm" style={{ color: "#dc2626" }}>
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-full px-4 py-3 font-medium text-white transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        style={{ backgroundColor: "#E0233A" }}
      >
        {pending ? "Gönderiliyor..." : "Demo İsteyin"}
      </button>
    </form>
  );
}
