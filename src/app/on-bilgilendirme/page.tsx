import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi — taslak.
 *
 * Satıcı taraf İşletme'dir (ödeme doğrudan İşletme'nin iyzico Pazaryeri
 * hesabına gider), Üleş sadece aracı teknoloji/tahsilat sağlayıcısıdır —
 * bu yüzden /gizlilik'teki gibi metin Branch'e özeldir.
 *
 * HUKUKİ NOT: Müşteri fiziksel olarak işletmede masada otururken sipariş
 * verdiği için bu ilişkinin klasik "mesafeli satış" (Mesafeli Sözleşmeler
 * Yönetmeliği) tanımına girip girmediği tartışmalıdır — taraflar aynı anda
 * fiziksel olarak bir aradadır. İyzico'nun üye işyeri onayı için temkinli
 * davranıp bu metni yine de bulunduruyoruz. Yayına almadan/iyzico'ya
 * sunmadan önce mutlaka bir hukuk danışmanına kontrol ettirin.
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

export default async function OnBilgilendirmePage({
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
  const taxBits = [branch?.taxOffice?.trim(), branch?.taxNumber?.trim()].filter(
    Boolean
  );
  const isComplete = !!name && contactBits.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white border rounded-2xl p-6 sm:p-8 space-y-5 text-sm leading-relaxed text-gray-700">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Masadan verilen sipariş ve kartlı ödeme için taslak metin
          </p>
        </div>

        {!isComplete && (
          <p className="text-xs bg-[#fef3c7] border border-[#fde68a] text-[#92400e] rounded-lg p-3">
            <strong>Bu metin henüz doldurulmamış bir şablondur.</strong>{" "}
            İşletme yetkilisi: Yönetim panelinde <em>Ayarlar</em> sayfasından
            işletme unvanı, vergi bilgisi ve iletişim bilgilerini girin. Bu
            sayfayı yayına almadan/iyzico'ya sunmadan önce mutlaka bir hukuk
            danışmanına kontrol ettirin — bu bir hukuki tavsiye değildir.
          </p>
        )}

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">1. Taraflar</h2>
          <p>
            <strong>Satıcı:</strong>{" "}
            <strong>{name || "[İŞLETME UNVANI]"}</strong>
            {taxBits.length > 0 && <> ({taxBits.join(" · ")})</>}
          </p>
          {contactBits.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {branch?.legalAddress && <li>Adres: {branch.legalAddress}</li>}
              {branch?.contactEmail && <li>E-posta: {branch.contactEmail}</li>}
              {branch?.contactPhone && <li>Telefon: {branch.contactPhone}</li>}
            </ul>
          ) : (
            <p>
              İletişim: <strong>[İLETİŞİM E-POSTASI / ADRES]</strong>
            </p>
          )}
          <p>
            <strong>Alıcı:</strong> Masada sipariş veren/ödeme yapan müşteri.
          </p>
          <p>
            <strong>Aracı Hizmet Sağlayıcı:</strong> Üleş — sipariş ve ödeme
            altyapısını sağlar, satışın tarafı değildir; ödeme tutarı
            doğrudan Satıcı&apos;nın hesabına aktarılır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            2. Sözleşmenin Konusu
          </h2>
          <p>
            Alıcı&apos;nın, Satıcı&apos;nın işletmesinde bizzat bulunduğu
            sırada QR menü üzerinden seçip sipariş verdiği yiyecek/içeceklerin
            hazırlanıp sunulması ve bunların bedelinin tahsil edilmesi. Ürün
            adı, adedi ve fiyatı sipariş anında ekranda gösterilir ve
            hesap/fiş üzerinden görüntülenebilir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">3. Ödeme</h2>
          <p>
            Ödeme; kartla ise iyzico&apos;nun PCI-DSS uyumlu, 3D Secure
            destekli altyapısı üzerinden doğrudan Satıcı&apos;nın alt üye
            işyeri hesabına, nakit/POS ile ise doğrudan işletme personeline
            yapılır. Kart bilgileri Üleş sunucularına hiçbir aşamada
            uğramaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">4. Teslimat</h2>
          <p>
            Sipariş, kargo/posta ile değil, aynı oturumda ve aynı mekânda
            (masada) hazırlanıp sunularak &quot;teslim edilmiş&quot; sayılır —
            klasik mesafeli satıştaki teslimat süreci bu işlemde
            bulunmamaktadır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">5. Cayma Hakkı</h2>
          <p>
            Mesafeli Sözleşmeler Yönetmeliği&apos;nin istisnaları arasında
            sayılan, niteliği itibarıyla iade edilemeyecek, çabuk bozulabilen
            veya son tüketim tarihi geçebilecek mallar ile ilgili
            sözleşmelerde ve hemen tüketilen yiyecek/içeceklerde cayma hakkı
            bulunmamaktadır. Bu nedenle hazırlanıp sunulan sipariş için 14
            günlük cayma hakkı kullanılamaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            6. İptal ve İade
          </h2>
          <p>
            Sipariş mutfağa düşmeden/hazırlanmaya başlamadan önce personelden
            iptal talep edilebilir. Hazırlanmış/sunulmuş sipariş için iade,
            yalnızca ayıplı/hatalı ürün halinde Satıcı&apos;nın kendi
            politikası çerçevesinde değerlendirilir. Kartlı ödemelerde iade,
            Satıcı&apos;nın iyzico üye işyeri panelinden yapılır — Üleş bu
            işleme aracılık etmez.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            7. Şikayet ve Uyuşmazlık
          </h2>
          <p>
            Talep ve şikayetler öncelikle yukarıdaki iletişim bilgisi
            üzerinden Satıcı&apos;ya iletilir. Çözülemeyen uyuşmazlıklarda
            Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">8. Onay</h2>
          <p>
            Ödeme adımına geçen Alıcı, sipariş konusu, fiyatı, ödeme şekli ve
            cayma hakkına ilişkin yukarıdaki bilgileri okuyup anladığını kabul
            eder.
          </p>
        </section>
      </div>
    </div>
  );
}
