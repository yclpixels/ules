"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendContactRequestAction, type ContactRequestState } from "@/lib/actions";
import { CONTACT_ERROR, parseContact } from "@/lib/contact";

const fieldClass =
  "w-full mt-1.5 rounded-xl px-4 py-3 outline-none transition-shadow focus:ring-2 focus:ring-[#7C6CFF]";
const fieldStyle = { border: "1px solid #E7E5F4", background: "#F7F6FC" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState<
    ContactRequestState,
    FormData
  >(sendContactRequestAction, undefined);
  // Alandan çıkınca anında uyar; asıl doğrulama sunucuda (lib/contact.ts).
  const [contactHint, setContactHint] = useState<string | null>(null);
  const router = useRouter();

  // Başarıda teşekkür sayfasına geç: ayrı bir adres, reklam/analitik
  // araçlarında "dönüşüm" olarak ölçülebilsin. Kişisel veri adrese konmaz.
  useEffect(() => {
    if (state?.success) router.push("/tesekkurler");
  }, [state?.success, router]);

  if (state?.success) {
    return (
      <div
        className="rounded-3xl p-8 text-center shadow-2xl"
        style={{ backgroundColor: "#ffffff", color: "#08061A" }}
      >
        <p className="text-lg font-semibold">Teşekkürler, talebiniz alındı.</p>
        <p className="text-sm mt-2" style={{ color: "#5B5B72" }}>
          Yazdığınız {state.contactKind === "phone" ? "numaradan" : "e-posta adresinden"}{" "}
          <strong style={{ color: "#08061A" }}>{state.contact}</strong> en kısa
          sürede size dönüş yapacağız.
        </p>
      </div>
    );
  }

  // React 19 form gönderiminden sonra alanları sıfırlıyor; hata dönerse
  // müşterinin yazdıkları kaybolmasın diye değerler state'ten geri doluyor.
  const values = state?.values;

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
        <label htmlFor="cf-business" className="text-sm font-medium" style={{ color: "#5B5B72" }}>
          İşletme adı
        </label>
        <input
          id="cf-business"
          name="businessName"
          required
          maxLength={150}
          defaultValue={values?.businessName}
          placeholder="Ör. Sahil Cafe"
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      <div>
        <label htmlFor="cf-contact" className="text-sm font-medium" style={{ color: "#5B5B72" }}>
          Size nasıl dönelim? (e-posta veya telefon)
        </label>
        <input
          id="cf-contact"
          name="contact"
          required
          maxLength={200}
          autoComplete="email"
          defaultValue={values?.contact}
          placeholder="ornek@gmail.com veya 0555 123 45 67"
          aria-describedby="cf-contact-hint"
          onBlur={(e) =>
            setContactHint(
              e.target.value.trim() && !parseContact(e.target.value) ? CONTACT_ERROR : null
            )
          }
          onChange={() => contactHint && setContactHint(null)}
          className={fieldClass}
          style={fieldStyle}
        />
        <p
          id="cf-contact-hint"
          className="text-xs mt-1.5"
          style={{ color: contactHint ? "#dc2626" : "#8A8AA0" }}
        >
          {contactHint ?? "Yazdığınız e-postaya ya da numaraya biz dönüş yapacağız."}
        </p>
      </div>

      <div>
        <label htmlFor="cf-message" className="text-sm font-medium" style={{ color: "#5B5B72" }}>
          Mesaj (opsiyonel)
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={3}
          maxLength={2000}
          defaultValue={values?.message}
          placeholder="Kaç masa, hangi şehir vb. kısaca yazabilirsiniz"
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      {state?.error && (
        <p className="text-sm" style={{ color: "#dc2626" }} role="alert">
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
      <p className="text-xs text-center" style={{ color: "#8A8AA0" }}>
        Formu göndererek bilgilerinizin size dönüş yapmak amacıyla işlenmesine
        ilişkin{" "}
        <Link href="/gizlilik-politikasi" className="underline">
          Gizlilik Politikası
        </Link>
        &apos;nı okuduğunuzu kabul etmiş olursunuz.
      </p>
    </form>
  );
}
