import MarketingPage from "@/components/marketing/MarketingPage";
import { Check, SOFT, MUTED, displayFont, monoFont } from "@/components/marketing/ui";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";
import { pageMetadata } from "@/lib/seo";
import BusinessApplicationForm from "./BusinessApplicationForm";

export const metadata = pageMetadata({
  title: "İşletme Başvurusu",
  description:
    "Restoran, kafe, fırın ya da pastaneniz için Üleş QR menü, masadan sipariş ve ödeme sistemine başvurun. Kurulum ve personel eğitimi bizden, ücretsiz deneme.",
  path: "/isletme-basvur",
});

const benefits = [
  "Kurulum ve personel eğitimi bizden",
  "Ücretsiz deneme süresi",
  "Kartlı ödeme olmadan da başlayabilirsiniz",
  "Ek donanım yok — tablet ya da telefon yeterli",
];

const process = [
  { title: "Sizi arıyoruz", text: "Başvurunuzu inceleyip genellikle aynı gün içinde dönüyoruz." },
  { title: "Menünüzü kuruyoruz", text: "Ürünler, kategoriler ve masalar birlikte giriliyor; QR kartlarınız hazır çıkıyor." },
  { title: "Personelinizi tanıştırıyoruz", text: "Kasa, garson ve mutfak ekranları için kısa bir tanıtım." },
];

export default function IsletmeBasvurPage() {
  return (
    <MarketingPage
      crumbs={[{ name: "İşletme Başvurusu", path: "/isletme-basvur" }]}
      eyebrow="İşletmeler için"
      title="İşletmenizi Üleş'e katın."
      intro="Formu doldurun; sizi arayıp ihtiyaçlarınızı dinleyelim ve sistemi birlikte kuralım. Başvuru ücretsizdir ve sizi hiçbir şeye bağlamaz."
      stickyCta={false}
    >
      <section style={{ background: SOFT }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_340px] lg:gap-14">
          <BusinessApplicationForm />

          <aside className="space-y-8 lg:pt-2">
            <div>
              <h2 className="text-xl" style={{ ...displayFont, fontWeight: 800 }}>
                Neler dahil?
              </h2>
              <ul className="mt-4 space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex gap-3">
                    <Check />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl" style={{ ...displayFont, fontWeight: 800 }}>
                Sonra ne olacak?
              </h2>
              <ol className="mt-4 space-y-5">
                {process.map((p, i) => (
                  <li key={p.title} className="flex gap-4">
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1D126D] text-xs font-semibold text-white"
                      style={monoFont}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block font-semibold">{p.title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed" style={{ color: MUTED }}>
                        {p.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="rounded-2xl border bg-white p-5 text-sm leading-relaxed" style={{ color: MUTED }}>
              Form yerine e-posta mı tercih edersiniz?{" "}
              <a href={PUBLIC_SUPPORT_MAILTO} className="font-semibold text-[#1D126D] underline underline-offset-2">
                {PUBLIC_SUPPORT_EMAIL}
              </a>
            </p>
          </aside>
        </div>
      </section>
    </MarketingPage>
  );
}
