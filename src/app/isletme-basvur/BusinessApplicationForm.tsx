"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendBusinessApplicationAction, type PublicFormState } from "@/lib/actions";
import { BUSINESS_TYPES } from "@/lib/publicForms";
import { Field, Honeypot, inputClass, TR_CITIES } from "@/components/marketing/FormField";

export default function BusinessApplicationForm() {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(
    sendBusinessApplicationAction,
    undefined
  );
  const router = useRouter();

  // Başarıda teşekkür sayfası: dönüşüm ayrı bir adres olarak ölçülebilsin.
  useEffect(() => {
    if (state?.success) router.push("/tesekkurler");
  }, [state?.success, router]);

  const err = (state && !state.success && state.fieldErrors) || {};
  const v = (state && !state.success && state.values) || {};
  const a11y = (id: string) => ({
    id,
    name: id,
    "aria-invalid": err[id] ? true : undefined,
    "aria-describedby": `${id}-desc`,
  });

  if (state?.success) {
    return (
      <div className="rounded-3xl border bg-white p-8 text-center" role="status">
        <p className="text-lg font-semibold">Başvurunuz alındı.</p>
        <p className="mt-2 text-gray-600">Yönlendiriliyorsunuz…</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="rounded-3xl border bg-white p-5 shadow-[0_20px_60px_-30px_rgba(8,6,26,0.25)] sm:p-8">
      <Honeypot />

      <fieldset>
        <legend className="text-base font-semibold">İşletme bilgileri</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="businessName" label="İşletme adı" error={err.businessName} className="sm:col-span-2">
            <input {...a11y("businessName")} required maxLength={150} autoComplete="organization" defaultValue={v.businessName} placeholder="Ör. Sahil Cafe" className={inputClass} />
          </Field>
          <Field id="businessType" label="İşletme türü" error={err.businessType}>
            <select {...a11y("businessType")} required defaultValue={v.businessType ?? ""} className={inputClass}>
              <option value="" disabled>Seçin</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field id="tables" label="Masa sayısı" optional error={err.tables}>
            <input {...a11y("tables")} inputMode="numeric" maxLength={4} defaultValue={v.tables} placeholder="Ör. 18" className={inputClass} />
          </Field>
          <Field id="city" label="Şehir" error={err.city}>
            <input {...a11y("city")} required list="tr-cities" maxLength={60} autoComplete="address-level1" defaultValue={v.city} placeholder="Ör. İzmir" className={inputClass} />
            <datalist id="tr-cities">
              {TR_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field id="district" label="İlçe" error={err.district}>
            <input {...a11y("district")} required maxLength={60} autoComplete="address-level2" defaultValue={v.district} placeholder="Ör. Karşıyaka" className={inputClass} />
          </Field>
          <Field id="address" label="İşletme adresi" error={err.address} className="sm:col-span-2">
            <textarea {...a11y("address")} required rows={2} maxLength={400} autoComplete="street-address" defaultValue={v.address} placeholder="Mahalle, cadde, no" className={inputClass} />
          </Field>
          <Field id="website" label="Instagram veya web sitesi" optional error={err.website} hint="Ör. instagram.com/isletmeniz ya da @isletmeniz" className="sm:col-span-2">
            <input {...a11y("website")} maxLength={200} inputMode="url" defaultValue={v.website} placeholder="instagram.com/isletmeniz" className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="text-base font-semibold">Yetkili bilgileri</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="ownerName" label="Ad soyad" error={err.ownerName} className="sm:col-span-2">
            <input {...a11y("ownerName")} required maxLength={100} autoComplete="name" defaultValue={v.ownerName} placeholder="Ör. Ayşe Yılmaz" className={inputClass} />
          </Field>
          <Field id="phone" label="Telefon" error={err.phone}>
            <input {...a11y("phone")} required type="tel" maxLength={40} autoComplete="tel" defaultValue={v.phone} placeholder="0555 123 45 67" className={inputClass} />
          </Field>
          <Field id="email" label="E-posta" error={err.email}>
            <input {...a11y("email")} required type="email" maxLength={150} autoComplete="email" defaultValue={v.email} placeholder="ornek@isletme.com" className={inputClass} />
          </Field>
          <Field id="note" label="Eklemek istedikleriniz" optional className="sm:col-span-2">
            <textarea {...a11y("note")} rows={3} maxLength={2000} defaultValue={v.note} placeholder="Kullandığınız kasa/POS sistemi, şube sayısı, sizi aramamız için uygun saatler…" className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <label className="mt-6 flex items-start gap-3 text-sm text-gray-600">
        <input
          type="checkbox"
          name="consent"
          defaultChecked={v.consent === "on"}
          aria-invalid={err.consent ? true : undefined}
          aria-describedby="consent-desc"
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#1D126D]"
        />
        <span>
          Bilgilerimin başvurumu değerlendirmek ve benimle iletişime geçmek amacıyla
          işlenmesine ilişkin{" "}
          <Link href="/kvkk" className="font-medium text-[#1D126D] underline underline-offset-2">
            KVKK aydınlatma metnini
          </Link>{" "}
          okudum.
        </span>
      </label>
      {err.consent && (
        <p id="consent-desc" className="mt-1.5 text-xs text-red-600" role="alert">
          {err.consent}
        </p>
      )}

      {state?.error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#1D126D] px-6 py-3.5 font-semibold text-white transition-[transform,opacity] active:scale-[0.99] disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Gönderiliyor…" : "Başvuruyu Gönder"}
      </button>
    </form>
  );
}
