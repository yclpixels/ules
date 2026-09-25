"use client";

import { useActionState, useState } from "react";
import {
  saveSubMerchantAction,
  type SubMerchantState,
} from "@/lib/actions";
import { CardIcon } from "@/components/icons";

const BRAND_GRADIENT = "linear-gradient(135deg, #fbbf24, #f87171)";

type Props = {
  legalName: string;
  contactEmail: string;
  contactPhone: string;
  legalAddress: string;
  subMerchantType: string;
  ibanNumber: string;
  taxOffice: string;
  taxNumber: string;
  identityNumber: string;
  isRegistered: boolean;
};

/**
 * iyzico Pazaryeri alt üye işyeri kaydı. KVKK bölümündeki unvan/adres/
 * iletişim bilgileri burada da kullanılır (iyzico'nun istediği alanlarla
 * büyük ölçüde örtüşüyor) — aynı bilgiyi iki kez girdirmemek için.
 */
export default function SubMerchantForm({
  legalName,
  contactEmail,
  contactPhone,
  legalAddress,
  subMerchantType,
  ibanNumber,
  taxOffice,
  taxNumber,
  identityNumber,
  isRegistered,
}: Props) {
  const [type, setType] = useState(subMerchantType || "LIMITED_OR_JOINT_STOCK_COMPANY");
  const [state, formAction, pending] = useActionState<SubMerchantState, FormData>(
    saveSubMerchantAction,
    undefined
  );

  return (
    <div className="rounded-2xl p-[2px]" style={{ background: BRAND_GRADIENT }}>
    <form action={formAction} className="bg-white rounded-[14px] p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <CardIcon className="w-4.5 h-4.5 text-amber-600" />
          iyzico Pazaryeri — Alt Üye İşyeri
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Kaydedilince kartlı ödeme tahsilatı platformun değil, doğrudan bu
          şubenin IBAN&apos;ına düşer. Bu ancak iyzico hesabınız
          Pazaryeri&apos;ne onaylandıktan sonra çalışır (henüz onaylanmadıysa{" "}
          <a href="mailto:entegrasyon@iyzico.com" className="underline">
            entegrasyon@iyzico.com
          </a>{" "}
          ile başvurun) — o zamana kadar denemek hata döner, bu beklenendir.
        </p>
        <p className="text-xs mt-2">
          Durum:{" "}
          {isRegistered ? (
            <span className="text-green-600 font-medium">Kayıtlı</span>
          ) : (
            <span className="text-amber-600 font-medium">Kayıtlı değil</span>
          )}
        </p>
      </div>

      {/* Unvan/adres/e-posta/telefon zaten KVKK bölümünde girildi; burada
          tekrar göstermek yerine aynı isimlerle gizli alan olarak taşınır. */}
      <input type="hidden" name="legalName" value={legalName} />
      <input type="hidden" name="contactEmail" value={contactEmail} />
      <input type="hidden" name="contactPhone" value={contactPhone} />
      <input type="hidden" name="legalAddress" value={legalAddress} />

      {(!legalName || !contactEmail || !contactPhone || !legalAddress) && (
        <p className="text-xs text-amber-600">
          Önce yukarıdaki KVKK bölümünden işletme unvanı, adres, e-posta ve
          telefonu doldurup kaydedin — bu form onları kullanıyor.
        </p>
      )}

      <div>
        <label className="text-sm font-medium">İşletme türü</label>
        <select
          name="subMerchantType"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full mt-1 border rounded-lg px-3 py-2"
        >
          <option value="LIMITED_OR_JOINT_STOCK_COMPANY">Limited / Anonim Şirket</option>
          <option value="PRIVATE_COMPANY">Şahıs Şirketi</option>
          <option value="PERSONAL">Şahıs (Vergi Mükellefi Değil)</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">IBAN</label>
        <input
          name="ibanNumber"
          defaultValue={ibanNumber}
          placeholder="TR.. .... .... .... .... .... .."
          className="w-full mt-1 border rounded-lg px-3 py-2 font-mono text-sm"
        />
      </div>

      {type === "PERSONAL" ? (
        <div>
          <label className="text-sm font-medium">TC Kimlik No</label>
          <input
            name="identityNumber"
            defaultValue={identityNumber}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
      ) : (
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <label className="text-sm font-medium">Vergi dairesi</label>
            <input
              name="taxOffice"
              defaultValue={taxOffice}
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
          {type === "LIMITED_OR_JOINT_STOCK_COMPANY" && (
            <div className="flex-1 min-w-[160px]">
              <label className="text-sm font-medium">Vergi numarası</label>
              <input
                name="taxNumber"
                defaultValue={taxNumber}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </div>
          )}
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">{state.success}</p>}

      <button
        disabled={pending}
        className="text-white rounded-lg px-4 py-2 text-sm font-medium shadow-md shadow-amber-600/20 disabled:opacity-50"
        style={{ background: BRAND_GRADIENT }}
      >
        {pending ? "Kaydediliyor..." : isRegistered ? "Bilgileri Güncelle" : "Alt Üye Oluştur"}
      </button>
    </form>
    </div>
  );
}
