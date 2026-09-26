import Link from "next/link";
import SubPage from "@/components/marketing/SubPage";
import LegalDraftNotice from "@/components/marketing/LegalDraftNotice";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "KVKK Aydınlatma Metni",
  description:
    "Üleş web sitesindeki demo, işletme başvurusu ve iletişim formları aracılığıyla toplanan kişisel verilere ilişkin 6698 sayılı KVKK kapsamında aydınlatma metni.",
  path: "/kvkk",
});

/**
 * Formlar için kısa aydınlatma metni (KVKK m.10). Ayrıntılı hâli ve
 * hizmet sağlayıcılar listesi Gizlilik Politikası'nda; ikisi çelişmemeli.
 */
export default function KvkkPage() {
  const legalName = process.env.PLATFORM_LEGAL_NAME?.trim();
  const h2 = "mt-10 mb-3 text-xl font-bold text-gray-900";
  const mail = (
    <a href={PUBLIC_SUPPORT_MAILTO} className="underline">
      {PUBLIC_SUPPORT_EMAIL}
    </a>
  );

  return (
    <SubPage
      crumbs={[{ name: "KVKK Aydınlatma Metni", path: "/kvkk" }]}
      title="KVKK Aydınlatma Metni"
      intro="6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi uyarınca, web sitemizdeki formlar aracılığıyla paylaştığınız kişisel verilerin nasıl işlendiğini açıklarız."
    >
      <LegalDraftNotice />
      <div className="leading-relaxed text-gray-700">
        <h2 className={h2}>Veri sorumlusu</h2>
        <p>
          <strong>{legalName || "Üleş"}</strong>. İletişim: {mail}
        </p>

        <h2 className={h2}>İşlenen veriler</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Kimlik ve iletişim: ad soyad, telefon, e-posta.</li>
          <li>İşletme bilgileri: işletme adı, türü, adresi, şehir/ilçe, masa sayısı, web sitesi veya sosyal medya adresi.</li>
          <li>Talep içeriği: formlara yazdığınız mesaj ve notlar.</li>
          <li>İşlem güvenliği: form gönderimindeki IP adresi (kötüye kullanımı önlemek için).</li>
        </ul>

        <h2 className={h2}>Amaç ve hukuki sebep</h2>
        <p>
          Talebinize dönüş yapmak, başvurunuzu değerlendirmek ve sözleşme öncesi
          görüşmeleri yürütmek (KVKK m.5/2-c); formların güvenliğini sağlamak (KVKK
          m.5/2-f, meşru menfaat). Verileriniz pazarlama amacıyla kullanılmaz ve
          satılmaz.
        </p>

        <h2 className={h2}>Aktarım</h2>
        <p>
          Veriler; barındırma, e-posta gönderimi ve güvenlik hizmeti aldığımız
          sağlayıcılar tarafından yalnızca bizim adımıza işlenir. Bu sağlayıcıların bir
          kısmı yurt dışındadır; aktarım KVKK m.9 kapsamında yapılır. Sağlayıcıların
          listesi{" "}
          <Link href="/gizlilik-politikasi" className="underline">
            Gizlilik Politikası
          </Link>
          &apos;nda yer alır.
        </p>

        <h2 className={h2}>Toplama yöntemi</h2>
        <p>Veriler, web sitemizdeki formlar aracılığıyla elektronik ortamda sizden toplanır.</p>

        <h2 className={h2}>Haklarınız</h2>
        <p>
          KVKK m.11 uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi talep
          etme, amacına uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü
          kişileri bilme, düzeltilmesini veya silinmesini isteme, itiraz etme ve
          zararın giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı {mail}{" "}
          adresine iletebilirsiniz; en geç 30 gün içinde yanıtlanır.
        </p>

        <h2 className={h2}>Restoran müşterileri</h2>
        <p>
          Masadaki QR kod ile verdiğiniz sipariş ve ödemelere ilişkin verilerin veri
          sorumlusu ilgili restorandır. Restoranın aydınlatma metnine masadaki ekranın
          altındaki bağlantıdan ulaşabilirsiniz.
        </p>
      </div>
    </SubPage>
  );
}
