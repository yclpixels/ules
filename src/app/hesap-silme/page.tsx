import Link from "next/link";
import SubPage from "@/components/marketing/SubPage";
import LegalDraftNotice from "@/components/marketing/LegalDraftNotice";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Hesap ve Veri Silme",
  description:
    "Üleş'te işletme hesabının, personel hesaplarının ve kişisel verilerin silinmesi nasıl talep edilir? Adım adım açıklama.",
  path: "/hesap-silme",
});

export default function HesapSilmePage() {
  const h2 = "mt-10 mb-3 text-xl font-bold text-gray-900";
  const mail = (
    <a href={PUBLIC_SUPPORT_MAILTO} className="underline">
      {PUBLIC_SUPPORT_EMAIL}
    </a>
  );

  return (
    <SubPage
      crumbs={[{ name: "Hesap ve Veri Silme", path: "/hesap-silme" }]}
      title="Hesap ve Veri Silme"
      intro="Hesabınızın ya da kişisel verilerinizin silinmesini nasıl talep edeceğinizi açıklarız."
    >
      <LegalDraftNotice />
      <div className="leading-relaxed text-gray-700">
        <h2 className={h2}>Restoran müşterileri</h2>
        <p>
          Masada QR ile sipariş vermek ya da ödemek için hesap açmanız gerekmez; bu
          yüzden silinecek bir müşteri hesabı yoktur. Sipariş ve ödeme kayıtlarının veri
          sorumlusu restorandır; bu kayıtların silinmesi için restorana başvurun. Fiş
          için e-posta adresinizi paylaştıysanız ve silinmesini istiyorsanız {mail}{" "}
          adresine restoranın adını ve tarihi yazın.
        </p>

        <h2 className={h2}>İşletme personeli</h2>
        <p>
          Personel hesapları işletmenin yöneticisi tarafından açılır ve kapatılır.
          Hesabınızın kapatılmasını istiyorsanız işletmenizin yöneticisine başvurun;
          yönetici Personel sayfasından hesabı pasifleştirdiğinde açık oturumlar da
          anında sona erer. Yasal saklama gerektiren işlem kayıtları (ör. kim hangi
          ödemeyi aldı) mevzuatın öngördüğü süre boyunca saklanır.
        </p>

        <h2 className={h2}>İşletme hesabı</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>İşletme sahibi ya da yetkilisi olarak {mail} adresine &quot;Hesap silme talebi&quot; konulu bir e-posta gönderin.</li>
          <li>İşletmenin adını ve kayıtlı iletişim bilgisini yazın; kimliğinizi doğrulamak için size dönüş yapacağız.</li>
          <li>
            Doğrulamadan sonra menü, masa ve personel bilgileri silinir. Mali ve yasal
            saklama yükümlülüğü olan kayıtlar (ödemeler, gün sonu kayıtları) süreleri
            dolana kadar saklanır, sonra silinir ya da anonimleştirilir.
          </li>
        </ol>

        <h2 className={h2}>Web sitesi formları</h2>
        <p>
          Demo, başvuru ya da iletişim formu ile gönderdiğiniz bilgilerin silinmesini
          istiyorsanız {mail} adresine yazmanız yeterlidir. Ayrıntılar için{" "}
          <Link href="/kvkk" className="underline">
            KVKK Aydınlatma Metni
          </Link>
          .
        </p>
      </div>
    </SubPage>
  );
}
