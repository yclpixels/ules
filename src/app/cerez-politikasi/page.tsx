import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez Politikası",
};

/**
 * Şu an sistemde tek çerez var: admin oturum çerezi (zorunlu, KVKK/GDPR
 * anlamında rıza gerektirmeyen "strictly necessary" kategori). Analytics/
 * reklam çerezi yok — bu yüzden burada bir "kabul et" bandı YOK; olsaydı
 * bu sayfa da güncellenmeli ve bir onay mekanizması eklenmeliydi.
 */
export default function CerezPolitikasiPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white border rounded-2xl p-6 sm:p-8 space-y-5 text-sm leading-relaxed text-gray-700">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Çerez Politikası
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Üleş platformunun kullandığı çerezler hakkında
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            Hangi çerezleri kullanıyoruz?
          </h2>
          <p>
            Üleş, ziyaretçi takibi, reklam veya analiz amaçlı hiçbir çerez
            kullanmaz. Sistemde yalnızca tek bir çerez bulunur:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Oturum çerezi</strong> — personelin admin paneline giriş
              yaptıktan sonra oturumunun açık kalmasını sağlar. Bu çerez
              olmadan panele giriş yapılamaz; bu yüzden rıza gerektirmeyen,
              hizmetin çalışması için zorunlu bir çerezdir.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            Müşteri (masa) tarafında
          </h2>
          <p>
            QR&apos;ı okutup menüyü görüntüleyen/sipariş veren müşterinin
            tarayıcısında sunucu tarafından oluşturulan bir çerez
            bulunmaz. Sepet/ödeme sonrası bazı bilgiler (ör. anket
            sorulduğunu hatırlamak için) yalnızca tarayıcınızın{" "}
            <code className="text-[11px]">sessionStorage</code>&apos;ında
            tutulur — bu bir çerez değildir, bizim sunucumuza gönderilmez ve
            sekmeyi kapattığınızda silinir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">Değişiklikler</h2>
          <p>
            İleride analiz veya pazarlama amaçlı bir çerez eklenirse, bu
            sayfa güncellenir ve gerekli onay mekanizması siteye eklenir.
          </p>
        </section>
      </div>
    </div>
  );
}
