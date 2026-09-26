import type { Metadata } from "next";
import Link from "next/link";
import SubPage from "@/components/marketing/SubPage";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description:
    "Üleş web sitesi ve demo formu üzerinden toplanan kişisel verilerin hangi amaçla işlendiği, kimlerle paylaşıldığı ve KVKK kapsamındaki haklarınız.",
  alternates: { canonical: "/gizlilik-politikasi" },
  robots: { index: true, follow: true },
};

/**
 * Üleş'in (platformun) KENDİ gizlilik politikası: tanıtım sitesi, demo formu
 * ve panelden gelen destek talepleri için veri sorumlusu platformun
 * kendisidir. /gizlilik ise farklıdır — restoranın masadaki müşterisine
 * yönelik, restoranın veri sorumlusu olduğu aydınlatma metni.
 *
 * Metin sitenin gerçekte topladığı verilere göre yazıldı; yeni bir veri
 * toplandığında (analitik, çerez vb.) güncellenmeli. Yayından önce hukuk
 * kontrolü önerilir.
 */
export default function GizlilikPolitikasiPage() {
  const legalName = process.env.PLATFORM_LEGAL_NAME?.trim();
  const h2 = "text-xl font-bold text-gray-900 mt-10 mb-3";

  return (
    <SubPage
      crumbs={[{ name: "Gizlilik Politikası", path: "/gizlilik-politikasi" }]}
      title="Gizlilik Politikası"
      intro="Bu sayfa, Üleş web sitesi ve demo formu üzerinden toplanan kişisel verilerin 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında nasıl işlendiğini açıklar."
    >
      {!legalName && (
        <p className="mb-8 rounded-xl border border-[#fde68a] bg-[#fef3c7] p-4 text-sm text-[#92400e]">
          Şirket unvanı henüz girilmedi (<code>PLATFORM_LEGAL_NAME</code>). Şirket
          kuruluşu tamamlanınca eklenmeli; metin yayından önce hukuk kontrolünden
          geçirilmelidir.
        </p>
      )}

      <div className="text-gray-700 leading-relaxed">
        <h2 className={h2}>1. Veri sorumlusu</h2>
        <p>
          Kişisel verileriniz, veri sorumlusu sıfatıyla{" "}
          <strong>{legalName || "Üleş"}</strong> (&quot;Üleş&quot;) tarafından
          işlenir. Bize{" "}
          <a href={PUBLIC_SUPPORT_MAILTO} className="underline">
            {PUBLIC_SUPPORT_EMAIL}
          </a>{" "}
          adresinden ulaşabilirsiniz.
        </p>

        <h2 className={h2}>2. Hangi verileri topluyoruz?</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Demo formu:</strong> işletme adı, e-posta adresi veya telefon
            numarası ve (yazarsanız) mesajınız.
          </li>
          <li>
            <strong>Destek talepleri</strong> (panel kullanan işletme personeli):
            ad, işletme, iletişim bilgisi ve talep metni.
          </li>
          <li>
            <strong>Güvenlik kayıtları:</strong> form ve giriş denemelerinde, kötüye
            kullanımı önlemek için IP adresi (hız sınırlama ve erişim kaydı).
          </li>
          <li>
            <strong>Çerezler:</strong> yalnızca personel girişinde oturumu açık
            tutan zorunlu oturum çerezi. Reklam veya analitik çerezi kullanmıyoruz
            (bkz.{" "}
            <Link href="/cerez-politikasi" className="underline">
              Çerez Politikası
            </Link>
            ).
          </li>
        </ul>

        <h2 className={h2}>3. Hangi amaçla ve hangi hukuki sebeple?</h2>
        <p>
          Demo ve destek taleplerine dönüş yapmak, talep ettiğiniz hizmeti
          sunmak ve sözleşme öncesi görüşmeleri yürütmek (KVKK m.5/2-c); sistemin
          güvenliğini sağlamak ve kötüye kullanımı önlemek (KVKK m.5/2-f, meşru
          menfaat). Verileriniz pazarlama listelerine eklenmez, satılmaz.
        </p>

        <h2 className={h2}>4. Kimlerle paylaşıyoruz?</h2>
        <p>
          Hizmeti sunabilmek için veriler aşağıdaki hizmet sağlayıcılar
          tarafından, yalnızca bizim adımıza işlenir:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Barındırma ve veritabanı: Railway</li>
          <li>Alan adı, güvenlik ve içerik dağıtımı: Cloudflare</li>
          <li>E-posta gönderimi (talep bildirimleri): Resend</li>
          <li>Kartlı ödeme (restoranların müşterileri için): iyzico</li>
        </ul>
        <p className="mt-3">
          Bu sağlayıcıların bir kısmının sunucuları yurt dışındadır; aktarım KVKK
          m.9 kapsamında gerçekleştirilir. Yasal zorunluluk hâlinde yetkili
          kamu kurumlarıyla paylaşılabilir.
        </p>

        <h2 className={h2}>5. Ne kadar süre saklıyoruz?</h2>
        <p>
          Demo ve destek talepleri, talep sonuçlandıktan sonra en fazla 2 yıl;
          güvenlik kayıtları mevzuatın öngördüğü süre boyunca saklanır. Süre
          sonunda silinir veya anonim hâle getirilir.
        </p>

        <h2 className={h2}>6. Haklarınız</h2>
        <p>
          KVKK m.11 uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi
          talep etme, düzeltilmesini veya silinmesini isteme, işlemeye itiraz
          etme ve zararın giderilmesini talep etme haklarına sahipsiniz.
          Başvurularınızı{" "}
          <a href={PUBLIC_SUPPORT_MAILTO} className="underline">
            {PUBLIC_SUPPORT_EMAIL}
          </a>{" "}
          adresine iletebilirsiniz; en geç 30 gün içinde yanıtlanır.
        </p>

        <h2 className={h2}>7. Restoran müşterileri</h2>
        <p>
          Bir restoranda masadaki QR kodu okuttuysanız, sipariş ve ödeme
          verilerinizin veri sorumlusu o restorandır; Üleş bu verileri restoran
          adına işler. Restoranın aydınlatma metnine masadaki ekranın altındaki
          bağlantıdan ulaşabilirsiniz.
        </p>
      </div>
    </SubPage>
  );
}
