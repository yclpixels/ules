import { prisma } from "@/lib/prisma";
import { verifyManagerSession } from "@/lib/dal";
import { updateBranchSettingsAction } from "@/lib/actions";
import { LOCALE_LABELS, parseLocales, SUPPORTED_LOCALES } from "@/lib/locales";
import { getBaseUrl } from "@/lib/baseUrl";
import { slugify } from "@/lib/slug";
import SubMerchantForm from "@/components/SubMerchantForm";

const BRAND_GRADIENT = "linear-gradient(135deg, #1D126D, #1D126D)";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await verifyManagerSession();
  const branch = await prisma.branch.findUniqueOrThrow({
    where: { id: session.branchId },
  });

  const activeLocales = parseLocales(branch.supportedLocales);
  const baseUrl = await getBaseUrl();
  const publicMenuUrl = branch.menuSlug
    ? `${baseUrl}/menu/${branch.menuSlug}`
    : null;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">Şube Ayarları</h1>

      <form
        action={updateBranchSettingsAction}
        className="bg-white border rounded-2xl p-4 space-y-4"
      >
        <div>
          <label className="text-sm font-medium">Google yorum linki</label>
          <p className="text-xs text-gray-400 mb-1">
            Müşteri ödemeden sonra 4+ yıldız verirse bu linke yönlendirilir.
            Google Business Profile → &quot;Yorum isteyin&quot; → linki
            kopyalayın (g.page/r/... ile başlar). Boş bırakırsanız adım
            atlanır.
          </p>
          <input
            name="googleReviewUrl"
            type="url"
            defaultValue={branch.googleReviewUrl ?? ""}
            placeholder="https://g.page/r/.../review"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Bahşiş seçenekleri (%)</label>
          <p className="text-xs text-gray-400 mb-1">
            Ödeme ekranında sunulan yüzdeler, virgülle ayırın (en fazla 4).
            Boş bırakırsanız bahşiş adımı gösterilmez.
          </p>
          <input
            name="tipPresets"
            defaultValue={branch.tipPresets}
            placeholder="5,10,15"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="border-t pt-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Herkese açık menü sayfası</p>
            <p className="text-xs text-gray-400 mt-1">
              Masaya bağlı olmayan, paylaşılabilir bir menü adresi. Web siteniz
              varsa gömebilir, yoksa Instagram biyografisinde ya da WhatsApp&apos;ta
              paylaşabilirsiniz. Boş bırakırsanız sayfa yayına girmez.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 shrink-0">/menu/</span>
            <input
              name="menuSlug"
              defaultValue={branch.menuSlug ?? ""}
              placeholder={slugify(branch.name) || "ornek-restoran"}
              className="flex-1 border rounded-lg px-3 py-2"
            />
          </div>
          {publicMenuUrl && (
            <div className="space-y-2">
              <p className="text-xs">
                Yayında:{" "}
                <a
                  href={publicMenuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {publicMenuUrl}
                </a>
              </p>
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  Kendi sitenize gömmek için bu kodu sayfanıza yapıştırın —
                  menü uzunluğuna göre yüksekliği kendiliğinden ayarlanır:
                </p>
                <textarea
                  readOnly
                  rows={5}
                  value={`<iframe id="ules-menu" src="${publicMenuUrl}" style="width:100%;height:600px;border:0" title="Menü"></iframe>\n<script>\nwindow.addEventListener("message", function(e) {\n  if (e.data && e.data.type === "ules-menu-height") {\n    var f = document.getElementById("ules-menu");\n    if (f) f.style.height = e.data.height + "px";\n  }\n});\n</script>`}
                  className="w-full border rounded-lg px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <label className="text-sm font-medium">
              Web siteniz / Instagram (opsiyonel)
            </label>
            <p className="text-xs text-gray-400 mb-1">
              Müşteri ekranının ve menü sayfasının altında link olarak görünür.
            </p>
            <input
              name="websiteUrl"
              type="url"
              defaultValue={branch.websiteUrl ?? ""}
              placeholder="https://instagram.com/ornekrestoran"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Menü dilleri</p>
            <p className="text-xs text-gray-400 mt-1">
              İlk seçili dil ana dildir — ürün ve kategori adları onunla
              girilir. Diğer diller için çeviriyi{" "}
              <span className="text-gray-300">Ürünler</span> sayfasından
              eklersiniz; çeviri girilmeyen ürün o dilde ana dildeki adıyla
              görünür.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {SUPPORTED_LOCALES.map((code) => (
              <label key={code} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="locales"
                  value={code}
                  defaultChecked={activeLocales.includes(code)}
                />
                {LOCALE_LABELS[code]}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="text-sm font-medium">
            Düşük puan uyarı e-postası
          </label>
          <p className="text-xs text-gray-400 mb-1">
            Müşteri düşük puan verdiğinde buraya bildirim gider. Boş
            bırakırsanız uyarı yalnızca panelde gösterilir.
          </p>
          <input
            name="alertEmail"
            type="email"
            defaultValue={branch.alertEmail ?? ""}
            placeholder="mudur@ornekrestoran.com"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="border-t pt-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="customerOrderingEnabled"
              defaultChecked={branch.customerOrderingEnabled}
              className="mt-1"
            />
            <span>
              <span className="text-sm font-medium">
                Müşteri QR&apos;dan kendi siparişini verebilsin
              </span>
              <span className="block text-xs text-gray-400 mt-1">
                Kapalıyken müşteri menüyü ve hesabını görür ama sipariş
                veremez — siparişi personel girer. Yeni kurulumlarda kapalı
                başlatıp, işletme sisteme alıştıktan sonra açmanız önerilir.
              </span>
            </span>
          </label>
        </div>

        <div className="border-t pt-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="cardPaymentEnabled"
              defaultChecked={branch.cardPaymentEnabled}
              className="mt-1"
            />
            <span>
              <span className="text-sm font-medium">
                QR ile kartlı ödemeye izin ver
              </span>
              <span className="block text-xs text-gray-400 mt-1">
                Kapalıyken müşteri hesabını görür ve kişi başı payını
                hesaplar, ödemeyi personele yapar — sistem para akışına hiç
                girmez. Açmadan önce bu şube adına gerçek bir üye işyeri
                (iyzico vb.) anlaşması yapılmış olmalı; aksi halde tahsilat
                başarısız olur.
              </span>
            </span>
          </label>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div>
            <p className="text-sm font-medium">
              KVKK aydınlatma metni bilgileri
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Müşterinin gördüğü aydınlatma metninde (
              <a
                href={`/gizlilik?sube=${session.branchId}`}
                target="_blank"
                className="underline"
              >
                /gizlilik
              </a>
              ) &quot;veri sorumlusu&quot; olarak bu bilgiler yazar. Boş
              bırakılırsa metin &quot;doldurulmamış şablon&quot; uyarısıyla
              görünür ve KVKK açısından geçerli sayılmaz.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">İşletme resmi unvanı</label>
            <input
              name="legalName"
              defaultValue={branch.legalName ?? ""}
              placeholder="Örnek Gıda San. ve Tic. Ltd. Şti."
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Adres</label>
            <textarea
              name="legalAddress"
              rows={2}
              defaultValue={branch.legalAddress ?? ""}
              placeholder="Mahalle, Cadde No, İlçe/İl"
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium">İletişim e-postası</label>
              <input
                name="contactEmail"
                type="email"
                defaultValue={branch.contactEmail ?? ""}
                placeholder="kvkk@ornekrestoran.com"
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </div>
            <div className="w-44">
              <label className="text-sm font-medium">Telefon</label>
              <input
                name="contactPhone"
                defaultValue={branch.contactPhone ?? ""}
                placeholder="0212 000 00 00"
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        <button
          className="text-white rounded-lg px-4 py-2 font-medium shadow-md shadow-amber-600/20"
          style={{ background: BRAND_GRADIENT }}
        >
          Kaydet
        </button>
      </form>

      <SubMerchantForm
        legalName={branch.legalName ?? ""}
        contactEmail={branch.contactEmail ?? ""}
        contactPhone={branch.contactPhone ?? ""}
        legalAddress={branch.legalAddress ?? ""}
        subMerchantType={branch.subMerchantType ?? ""}
        ibanNumber={branch.ibanNumber ?? ""}
        taxOffice={branch.taxOffice ?? ""}
        taxNumber={branch.taxNumber ?? ""}
        identityNumber={branch.identityNumber ?? ""}
        isRegistered={!!branch.subMerchantKey}
      />
    </div>
  );
}
