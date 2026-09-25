import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kullanım Şartları",
};

/**
 * Platform (Üleş) ile onu kullanan işletme arasındaki SaaS sözleşmesi —
 * /gizlilik'ten farklı: o müşteri-işletme arasındaki KVKK ilişkisini anlatır,
 * bu ise Üleş-işletme arasındaki hizmet ilişkisini. Şirket henüz resmi olarak
 * kurulmadığı için unvan/iletişim env değişkenlerinden okunur — boşsa şablon
 * uyarısı çıkar (bkz. /gizlilik'teki aynı desen).
 */
export default function KullanimSartlariPage() {
  const legalName = process.env.PLATFORM_LEGAL_NAME?.trim();
  const contactEmail = process.env.PLATFORM_CONTACT_EMAIL?.trim();
  const isComplete = !!legalName && !!contactEmail;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white border rounded-xl p-6 sm:p-8 space-y-5 text-sm leading-relaxed text-gray-700">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Kullanım Şartları
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Üleş platformunu kullanan işletmeler için hizmet şartları
          </p>
        </div>

        {!isComplete && (
          <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
            <strong>Bu metin henüz doldurulmamış bir şablondur.</strong> Şirket
            unvanı ve iletişim bilgisi{" "}
            <code className="text-[11px]">PLATFORM_LEGAL_NAME</code> /{" "}
            <code className="text-[11px]">PLATFORM_CONTACT_EMAIL</code> ortam
            değişkenleriyle girilmeli (şirket kuruluşu tamamlanınca). Yayına
            almadan önce mutlaka bir hukuk danışmanına kontrol ettirin — bu
            metin bir taslaktır, hukuki tavsiye yerine geçmez.
          </p>
        )}

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">1. Taraflar</h2>
          <p>
            Bu şartlar, <strong>{legalName || "[ŞİRKET UNVANI]"}</strong>{" "}
            (&quot;Üleş&quot;) tarafından işletilen masa QR sipariş, hesap
            bölüşme ve ödeme yazılımını (&quot;Hizmet&quot;) kullanan restoran,
            kafe ve benzeri işletmeler (&quot;İşletme&quot;) için geçerlidir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">2. Hizmetin Kapsamı</h2>
          <p>
            Üleş; QR ile menü/sipariş, hesap bölüşme, mutfak ekranı, personel
            yönetimi ve ödeme altyapısına (iyzico) entegrasyon sağlayan bir
            yazılım hizmetidir (SaaS). Üleş bir restoran/gıda işletmecisi
            değildir — sunulan yemek/içeceğin kalitesi, fiyatı ve mevzuata
            uygunluğu tamamen İşletme&apos;nin sorumluluğundadır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            3. Ödeme ve Tahsilat
          </h2>
          <p>
            Hizmet aboneliği ücreti Üleş tarafından ayrıca faturalanır ve
            banka havalesi/EFT ile tahsil edilir; bu şartlar kapsamında
            otomatik kart tahsilatı yapılmaz.
          </p>
          <p>
            Müşterilerin QR üzerinden yaptığı ödemeler ise İşletme&apos;nin
            iyzico Pazaryeri alt üye işyeri hesabına <strong>doğrudan</strong>{" "}
            aktarılır — Üleş bu tutarları hiçbir aşamada tahsil etmez veya elinde
            tutmaz. Kartlı ödeme özelliğinin çalışabilmesi için İşletme, iyzico
            (veya sistemde tanımlı ödeme sağlayıcısı) ile ayrıca bir üye işyeri
            sözleşmesi kurmuş olmalıdır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            4. İptal ve İade
          </h2>
          <p>
            Müşteri ödemeleri doğrudan İşletme&apos;nin hesabına gittiği için,
            sipariş iptali, hatalı tahsilat itirazı ve iade talepleri
            İşletme&apos;nin kendi politikası ve iyzico üye işyeri panelindeki
            iade araçları üzerinden yürütülür. Üleş bu ödeme ilişkisine taraf
            olmadığından iade işlemini bizzat gerçekleştiremez.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            5. İşletmenin Sorumlulukları
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Menü, fiyat ve alerjen bilgilerinin doğruluğu</li>
            <li>Gıda güvenliği ve tüketici mevzuatına uyum</li>
            <li>
              Müşterilerine yönelik kendi KVKK aydınlatma metnini (
              <Link href="/gizlilik" className="underline">
                /gizlilik
              </Link>
              ) doldurup güncel tutmak
            </li>
            <li>Personel hesaplarının güvenliğinden sorumlu olmak</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            6. Hizmetin Sürekliliği ve Sorumluluğun Sınırlanması
          </h2>
          <p>
            Üleş, Hizmet&apos;i makul özenle sürekli çalışır tutmaya çalışır
            ancak kesintisiz veya hatasız çalışacağını garanti etmez. Üleş,
            İşletme&apos;nin ödeme sağlayıcısıyla ilişkisinden, gıda/hizmet
            kalitesinden veya üçüncü taraf hizmetlerdeki (iyzico, e-posta
            sağlayıcı vb.) kesintilerden doğan zararlardan sorumlu tutulamaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            7. Fikri Mülkiyet
          </h2>
          <p>
            Yazılımın kendisi, tasarımı ve markası Üleş&apos;e aittir.
            İşletme, kendi menü içeriği ve verileri üzerindeki haklarını
            korur.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">8. Fesih</h2>
          <p>
            Taraflardan her biri, aboneliği makul bir bildirim süresiyle
            sonlandırabilir. Fesih sonrası İşletme verileri makul bir süre
            saklanır, ardından silinir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            9. Uygulanacak Hukuk
          </h2>
          <p>
            Bu şartlar Türkiye Cumhuriyeti kanunlarına tabidir; olası
            uyuşmazlıklarda İşletme&apos;nin bulunduğu yer mahkemeleri ve icra
            daireleri yetkilidir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            10. İletişim
          </h2>
          <p>
            Sorularınız için:{" "}
            <strong>{contactEmail || "[İLETİŞİM E-POSTASI]"}</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
