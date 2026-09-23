import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * KVKK aydınlatma metni. Metin şubeye özeldir (veri sorumlusu restoranın
 * kendisidir, biz veri işleyeniz), bu yüzden işletme bilgileri `Branch`'ten
 * okunur ve `/admin/ayarlar`'dan doldurulur.
 *
 * Şube üç yoldan bulunur: müşteri masadan geldiyse `?masa=<qrToken>`,
 * fiş sayfasından geldiyse `?fis=<orderId>`, yönetim panelinden önizleme
 * yapılıyorsa `?sube=<branchId>`. Hiçbiri yoksa (doğrudan /gizlilik açıldıysa)
 * tek şube varsa o gösterilir, birden fazlaysa şablon uyarısı çıkar.
 */
async function resolveBranch(params: {
  masa?: string;
  fis?: string;
  sube?: string;
}) {
  if (params.sube) {
    const branch = await prisma.branch.findUnique({ where: { id: params.sube } });
    if (branch) return branch;
  }
  if (params.masa) {
    const table = await prisma.table.findUnique({
      where: { qrToken: params.masa },
      select: { branch: true },
    });
    if (table) return table.branch;
  }
  if (params.fis) {
    const order = await prisma.order.findUnique({
      where: { id: params.fis },
      select: { table: { select: { branch: true } } },
    });
    if (order) return order.table.branch;
  }
  const branches = await prisma.branch.findMany({ take: 2 });
  return branches.length === 1 ? branches[0] : null;
}

export default async function GizlilikPage({
  searchParams,
}: {
  searchParams: Promise<{ masa?: string; fis?: string; sube?: string }>;
}) {
  const branch = await resolveBranch(await searchParams);
  const name = branch?.legalName?.trim();
  const contactBits = [
    branch?.contactEmail?.trim(),
    branch?.contactPhone?.trim(),
    branch?.legalAddress?.trim(),
  ].filter(Boolean);
  // Unvan ve en az bir iletişim kanalı yoksa metin KVKK açısından eksiktir.
  const isComplete = !!name && contactBits.length > 0;

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

        {!isComplete && (
          <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
            <strong>Bu metin henüz doldurulmamış bir şablondur.</strong> İşletme
            yetkilisi: Yönetim panelinde <em>Ayarlar</em> sayfasından işletme
            unvanı ve iletişim bilgilerini girin. Metni yayına almadan önce bir
            hukuk danışmanına kontrol ettirin — bu bir hukuki tavsiye değildir.
          </p>
        )}

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">1. Veri Sorumlusu</h2>
          <p>
            Bu sistem,{" "}
            <strong>{name || "[İŞLETME UNVANI]"}</strong> (&quot;İşletme&quot;)
            tarafından, masadan sipariş ve ödeme hizmeti sunmak amacıyla
            işletilmektedir. İşletme, KVKK anlamında <em>veri sorumlusudur</em>.
          </p>
          {contactBits.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {branch?.contactEmail && (
                <li>E-posta: {branch.contactEmail}</li>
              )}
              {branch?.contactPhone && <li>Telefon: {branch.contactPhone}</li>}
              {branch?.legalAddress && <li>Adres: {branch.legalAddress}</li>}
            </ul>
          ) : (
            <p>
              Veri sorumlusuna{" "}
              <strong>[İLETİŞİM E-POSTASI / ADRES]</strong> üzerinden
              ulaşabilirsiniz.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">2. Toplanan Veriler</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sipariş ve hesap bilgileri (ürün, tutar, masa)</li>
            <li>Ödeme sırasında girdiğiniz isim (opsiyonel)</li>
            <li>Fişi e-posta ile almak istemeniz halinde e-posta adresiniz</li>
            <li>
              Değerlendirme yapmanız halinde verdiğiniz puanlar ve yorum metni
              (isimsiz olarak saklanır)
            </li>
            <li>
              Kart ile ödemede kart bilgileriniz bu sisteme değil, doğrudan ödeme
              sağlayıcısının güvenli altyapısına girilir — bizim sunucularımızda
              tutulmaz.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">3. İşlenme Amacı</h2>
          <p>
            Verileriniz yalnızca siparişinizin/hesabınızın yönetilmesi, ödemenizin
            alınması, talep etmeniz halinde fiş gönderilmesi ve hizmet kalitesinin
            ölçülmesi amacıyla işlenir. Pazarlama amacıyla kullanılmaz veya
            satılmaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">4. Aktarım</h2>
          <p>
            Ödeme bilgileriniz tahsilat amacıyla ödeme sağlayıcısı ile; e-posta
            adresiniz (fiş talep etmeniz halinde) e-posta gönderim sağlayıcımızla
            paylaşılır. Sistem altyapısı, İşletme adına bir yazılım sağlayıcısı
            tarafından <em>veri işleyen</em> sıfatıyla işletilmektedir. Bunların
            dışında üçüncü taraflarla paylaşılmaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">5. Saklama Süresi</h2>
          <p>
            Sipariş ve ödeme kayıtları, yasal saklama yükümlülükleri ve olası
            uyuşmazlıkların çözümü amacıyla mevzuatın öngördüğü süre boyunca
            saklanır; sürenin sonunda silinir veya anonim hale getirilir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">6. Haklarınız</h2>
          <p>
            KVKK&apos;nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini
            öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını
            öğrenme, düzeltilmesini veya silinmesini isteme ve işlenmesine itiraz
            etme haklarına sahipsiniz. Taleplerinizi yukarıdaki iletişim bilgisi
            üzerinden iletebilirsiniz; başvurunuz en geç 30 gün içinde
            sonuçlandırılır.
          </p>
        </section>
      </div>
    </div>
  );
}
