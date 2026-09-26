import type { ReactNode } from "react";

/** Tanıtım sitesi formlarının ortak alan düzeni: etiket, alan, ipucu/hata. */
export const inputClass =
  "mt-1.5 block w-full rounded-xl border bg-[#F7F6FC] px-4 py-3 text-base outline-none transition-[box-shadow,border-color] focus:border-[#7C6CFF] focus:bg-white focus:ring-4 focus:ring-[#7C6CFF]/15 aria-[invalid=true]:border-red-400 aria-[invalid=true]:bg-red-50/40";

export function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
  className = "",
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-[#39384E]">
        {label}
        {optional && <span className="ml-1 font-normal text-gray-500">(isteğe bağlı)</span>}
      </label>
      {children}
      {(error || hint) && (
        <p
          id={`${id}-desc`}
          className={`mt-1.5 text-xs ${error ? "text-red-600" : "text-gray-500"}`}
          role={error ? "alert" : undefined}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

/** Bot tuzağı: gerçek kullanıcı görmez/doldurmaz (sunucu doluysa sessizce "başarılı" der). */
export function Honeypot() {
  return (
    <input
      type="text"
      name="website_url"
      tabIndex={-1}
      autoComplete="off"
      className="hidden"
      aria-hidden="true"
    />
  );
}

export const TR_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
  "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
  "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
  "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli",
  "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
  "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
];
