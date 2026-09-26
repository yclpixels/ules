import type { Metadata } from "next";
import Link from "next/link";
import SubPage from "@/components/marketing/SubPage";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_MAILTO } from "@/lib/contact";

/**
 * Demo formu gönderildikten sonra gelinen teşekkür sayfası. Ayrı bir adres
 * olması, Google Ads / Analytics'te "dönüşüm" olarak ölçülebilmesini sağlar.
 * Arama motorlarına kapalı (formu doldurmadan buraya gelinmemeli). Kişisel
 * veri adrese konmaz.
 */
export const metadata: Metadata = {
  title: "Talebiniz alındı",
  description: "Demo talebiniz bize ulaştı; en kısa sürede dönüş yapacağız.",
  robots: { index: false, follow: false },
};

const steps = [
  ["Sizi arıyoruz", "Yazdığınız e-posta ya da telefondan, genelde aynı gün içinde."],
  ["Menünüzü birlikte kuruyoruz", "Ürünleriniz, masalarınız ve QR kodlarınız hazır çıkıyor."],
  ["Personelinizi eğitiyoruz", "Garson, mutfak ve kasa ekranları için kısa bir tanıtım."],
];

export default function TesekkurlerPage() {
  return (
    <SubPage
      crumbs={[{ name: "Talebiniz alındı", path: "/tesekkurler" }]}
      title="Teşekkürler, talebiniz alındı."
      intro="Demo talebiniz ekibimize ulaştı. Bundan sonra şöyle ilerliyoruz:"
    >
      <ol className="space-y-4">
        {steps.map(([title, text], i) => (
          <li key={title} className="flex gap-4 rounded-2xl border bg-gray-50 p-5">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
              style={{ background: "#1D126D" }}
            >
              {i + 1}
            </span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="block text-gray-600">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-gray-600">
        Beklemek istemiyor musunuz? Doğrudan yazın:{" "}
        <a href={PUBLIC_SUPPORT_MAILTO} className="font-semibold underline" style={{ color: "#1D126D" }}>
          {PUBLIC_SUPPORT_EMAIL}
        </a>
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/#paneller" className="h-12 inline-flex items-center rounded-full px-6 font-semibold text-white" style={{ background: "#1D126D" }}>
          Panelleri inceleyin
        </Link>
        <Link href="/#sss" className="h-12 inline-flex items-center rounded-full border px-6 font-semibold">
          Sık sorulan sorular
        </Link>
      </div>
    </SubPage>
  );
}
