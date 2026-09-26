import Link from "next/link";
import SubPage from "@/components/marketing/SubPage";
import LegalDraftNotice from "@/components/marketing/LegalDraftNotice";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "İade ve İptal Politikası",
  description:
    "Restoranda QR ile yapılan ödemelerin iptali ve iadesi nasıl işler? Müşteriler ve Üleş'i kullanan işletmeler için iade ve iptal koşulları.",
  path: "/iade-iptal",
});

export default function IadeIptalPage() {
  const h2 = "mt-10 mb-3 text-xl font-bold text-gray-900";

  return (
    <SubPage
      crumbs={[{ name: "İade ve İptal Politikası", path: "/iade-iptal" }]}
      title="İade ve İptal Politikası"
      intro="Masada QR ile yapılan ödemeler restorana yapılır. Bu sayfa, iptal ve iade taleplerinin kime ve nasıl iletileceğini açıklar."
    >
      <LegalDraftNotice />
      <div className="leading-relaxed text-gray-700">
        <h2 className={h2}>Restoran müşterileri</h2>
        <p>
          Sipariş ettiğiniz ürünlerin satıcısı restorandır; ödemeniz iyzico&apos;nun
          lisanslı altyapısı üzerinden doğrudan restoranın hesabına yapılır. Üleş bu
          işlemde satıcı ya da ödeme kuruluşu değildir.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Sipariş iptali:</strong> Mutfağa iletilmiş bir siparişin iptali
            restoranın takdirindedir. Lütfen masadaki personele başvurun.
          </li>
          <li>
            <strong>Ödeme iadesi:</strong> Hatalı ya da fazla çekim gibi durumlarda iade
            talebinizi restorana iletin. Restoran iadeyi onayladığında tutar, ödeme
            yaptığınız karta bankanızın süreleri içinde yansır.
          </li>
          <li>
            <strong>Tamamlanmamış ödeme:</strong> Ödeme sayfası yarıda kaldıysa ve
            kartınızdan tutar çekilmediyse işlem kısa bir süre sonra (en geç yaklaşık
            40 dakika içinde) kendiliğinden iptal olur; seçtiğiniz kalemler yeniden
            ödenebilir hâle gelir.
          </li>
        </ul>
        <p className="mt-4">
          Restorana ulaşamadıysanız ya da ödemeyle ilgili teknik bir sorun yaşadıysanız,
          restoranın adını, masayı ve ödeme saatini belirterek{" "}
          <a href={PUBLIC_SUPPORT_MAILTO} className="underline">
            {PUBLIC_SUPPORT_EMAIL}
          </a>{" "}
          adresine yazın; restoranla iletişime geçmenize yardımcı olalım.
        </p>

        <h2 className={h2}>Üleş&apos;i kullanan işletmeler</h2>
        <p>
          Abonelik ücretleri, deneme süresi ve iptal koşulları işletmeyle yapılan
          sözleşmede belirlenir. Aboneliğinizi sonlandırmak için bize yazmanız yeterlidir;
          verilerinizin silinmesiyle ilgili ayrıntılar{" "}
          <Link href="/hesap-silme" className="underline">
            Hesap Silme
          </Link>{" "}
          sayfasındadır.
        </p>
      </div>
    </SubPage>
  );
}
