export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white border rounded-xl p-6 sm:p-8 space-y-5 text-sm leading-relaxed text-gray-700">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Aydınlatma Metni — Kişisel Verilerin Korunması
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında
          </p>
        </div>

        <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
          Bu metin bir şablondur. İşletmenizin unvanı, adresi ve iletişim bilgileriyle
          doldurulmalı ve yayına almadan önce bir hukuk danışmanına kontrol ettirilmelidir.
          Bu bir hukuki tavsiye değildir.
        </p>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">1. Veri Sorumlusu</h2>
          <p>
            Bu sistem, <strong>[İŞLETME UNVANI]</strong> (&quot;İşletme&quot;) tarafından,
            masadan sipariş ve ödeme hizmeti sunmak amacıyla işletilmektedir. Veri
            sorumlusuna <strong>[İLETİŞİM E-POSTASI / ADRES]</strong> üzerinden
            ulaşabilirsiniz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">2. Toplanan Veriler</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sipariş ve hesap bilgileri (ürün, tutar, masa)</li>
            <li>Ödeme sırasında girdiğiniz isim (opsiyonel)</li>
            <li>Fişi e-posta ile almak istemeniz halinde e-posta adresiniz</li>
            <li>
              Kart ile ödemede kart bilgileriniz bu sisteme değil, doğrudan ödeme
              sağlayıcısının (iyzico) güvenli altyapısına girilir — bizim sunucularımızda
              tutulmaz.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">3. İşlenme Amacı</h2>
          <p>
            Verileriniz yalnızca siparişinizin/hesabınızın yönetilmesi, ödemenizin
            alınması ve talep etmeniz halinde fiş gönderilmesi amacıyla işlenir.
            Pazarlama amacıyla kullanılmaz veya satılmaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">4. Aktarım</h2>
          <p>
            Ödeme bilgileriniz tahsilat amacıyla ödeme sağlayıcısı iyzico ile;
            e-posta adresiniz (fiş talep etmeniz halinde) e-posta gönderim
            sağlayıcımızla paylaşılır. Bunların dışında üçüncü taraflarla paylaşılmaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">5. Saklama Süresi</h2>
          <p>
            Sipariş ve ödeme kayıtları, yasal saklama yükümlülükleri ve olası
            uyuşmazlıkların çözümü amacıyla makul bir süre boyunca saklanır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">6. Haklarınız</h2>
          <p>
            KVKK&apos;nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini
            öğrenme, işlenmişse buna ilişkin bilgi talep etme, düzeltilmesini veya
            silinmesini isteme haklarına sahipsiniz. Taleplerinizi yukarıdaki iletişim
            bilgisi üzerinden iletebilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}
