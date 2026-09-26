import Link from "next/link";
import MarketingPage from "@/components/marketing/MarketingPage";
import { SOFT, MUTED, BRAND, displayFont } from "@/components/marketing/ui";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";
import { formattedAddress, hasAddress, siteContent, telHref } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import ContactMessageForm from "./ContactMessageForm";

export const metadata = pageMetadata({
  title: "İletişim",
  description:
    "Üleş ekibine ulaşın: ürün ve demo soruları, mevcut işletmeler için destek, ödeme ve fiş sorunları. E-posta ve iletişim formu.",
  path: "/iletisim",
});

const SOCIAL_LABELS: Record<string, string> = { instagram: "Instagram", linkedin: "LinkedIn", x: "X" };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
        {children}
      </div>
    </div>
  );
}

export default function IletisimPage() {
  const social = Object.entries(siteContent.social).filter(([, url]) => url);
  const linkClass = "font-semibold underline underline-offset-2";

  return (
    <MarketingPage
      crumbs={[{ name: "İletişim", path: "/iletisim" }]}
      eyebrow="İletişim"
      title="Size nasıl yardımcı olalım?"
      intro="Ürün hakkında soru, mevcut işletmeniz için destek ya da masada yaşadığınız bir ödeme sorunu — hepsi için buradayız."
    >
      <section style={{ background: SOFT }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[340px_1fr] lg:gap-14">
          <div className="space-y-4">
            <h2 className="sr-only">İletişim kanalları</h2>
            <Card title="E-posta">
              <a href={PUBLIC_SUPPORT_MAILTO} className={linkClass} style={{ color: BRAND }}>
                {PUBLIC_SUPPORT_EMAIL}
              </a>
              <span className="mt-1 block">Genellikle aynı gün içinde yanıtlıyoruz.</span>
            </Card>
            {siteContent.phone && (
              <Card title="Telefon">
                <a href={telHref(siteContent.phone)} className={linkClass} style={{ color: BRAND }}>
                  {siteContent.phone}
                </a>
              </Card>
            )}
            {siteContent.whatsapp && (
              <Card title="WhatsApp">
                <a
                  href={`https://wa.me/${siteContent.whatsapp}`}
                  target="_blank"
                  rel="noopener"
                  className={linkClass}
                  style={{ color: BRAND }}
                >
                  Mesaj gönderin
                </a>
              </Card>
            )}
            <Card title="Mevcut işletmeler için destek">
              Panele giriş yaptıktan sonra menüdeki <strong className="text-gray-900">Destek</strong>{" "}
              bölümünden yazarsanız talebiniz şubenizle birlikte bize gelir.{" "}
              <Link href="/admin/login" className={linkClass} style={{ color: BRAND }}>
                Personel girişi
              </Link>
            </Card>
            <Card title="İşletmenizi eklemek mi istiyorsunuz?">
              <Link href="/isletme-basvur" className={linkClass} style={{ color: BRAND }}>
                İşletme başvuru formu
              </Link>
            </Card>
            {hasAddress() && (
              <Card title="Adres">
                <address className="not-italic">{formattedAddress()}</address>
              </Card>
            )}
            {social.length > 0 && (
              <Card title="Sosyal medya">
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {social.map(([k, url]) => (
                    <li key={k}>
                      <a href={url} target="_blank" rel="noopener" className={linkClass} style={{ color: BRAND }}>
                        {SOCIAL_LABELS[k] ?? k}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          <div>
            <h2 className="mb-5 text-2xl sm:text-3xl" style={{ ...displayFont, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Bize yazın
            </h2>
            <ContactMessageForm />
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
