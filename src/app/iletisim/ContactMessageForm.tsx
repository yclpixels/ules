"use client";

import { useActionState } from "react";
import Link from "next/link";
import { sendContactMessageAction, type PublicFormState } from "@/lib/actions";
import { CONTACT_TOPICS } from "@/lib/publicForms";
import { Field, Honeypot, inputClass } from "@/components/marketing/FormField";

export default function ContactMessageForm() {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(
    sendContactMessageAction,
    undefined
  );

  if (state?.success) {
    return (
      <div className="rounded-3xl border bg-white p-8" role="status">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-700" aria-hidden="true">
          <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="mt-5 text-xl font-semibold">Mesajınız bize ulaştı.</p>
        <p className="mt-2 leading-relaxed text-gray-600">
          {state.contact ? (
            <>
              <strong className="text-gray-900">{state.contact}</strong> üzerinden size dönüş yapacağız.
            </>
          ) : (
            "En kısa sürede size dönüş yapacağız."
          )}
        </p>
      </div>
    );
  }

  const err = (state && !state.success && state.fieldErrors) || {};
  const v = (state && !state.success && state.values) || {};
  const a11y = (id: string) => ({
    id,
    name: id,
    "aria-invalid": err[id] ? true : undefined,
    "aria-describedby": `${id}-desc`,
  });

  return (
    <form action={action} noValidate className="rounded-3xl border bg-white p-5 shadow-[0_20px_60px_-30px_rgba(8,6,26,0.25)] sm:p-8">
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Adınız" error={err.name}>
          <input {...a11y("name")} required maxLength={100} autoComplete="name" defaultValue={v.name} className={inputClass} />
        </Field>
        <Field id="contact" label="E-posta veya telefon" error={err.contact}>
          <input {...a11y("contact")} required maxLength={200} autoComplete="email" defaultValue={v.contact} placeholder="ornek@gmail.com" className={inputClass} />
        </Field>
        <Field id="topic" label="Konu" error={err.topic} className="sm:col-span-2">
          <select {...a11y("topic")} required defaultValue={v.topic ?? ""} className={inputClass}>
            <option value="" disabled>Seçin</option>
            {CONTACT_TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field id="message" label="Mesajınız" error={err.message} className="sm:col-span-2">
          <textarea {...a11y("message")} required rows={5} maxLength={3000} defaultValue={v.message} placeholder="Ödeme ya da sipariş sorunu yaşadıysanız işletmenin adını ve masayı da yazın." className={inputClass} />
        </Field>
      </div>

      {state?.error && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-gray-500 sm:max-w-xs">
          Bilgileriniz yalnızca size dönüş yapmak için kullanılır.{" "}
          <Link href="/kvkk" className="underline">
            KVKK aydınlatma metni
          </Link>
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1D126D] px-7 py-3.5 font-semibold text-white transition-[transform,opacity] active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "Gönderiliyor…" : "Mesajı Gönder"}
        </button>
      </div>
    </form>
  );
}
