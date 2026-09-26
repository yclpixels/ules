import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildReceiptView, getReceiptData, RECEIPT_DISCLAIMER } from "@/lib/receipt";
import EmailForm from "./EmailForm";

export const metadata: Metadata = {
  title: "Fiş",
  robots: { index: false, follow: false },
};

function Row({ left, right, className = "" }: { left: React.ReactNode; right: React.ReactNode; className?: string }) {
  return (
    <div className={`flex justify-between gap-3 ${className}`}>
      <span className="min-w-0">{left}</span>
      <span className="shrink-0 text-right">{right}</span>
    </div>
  );
}

const Dashed = () => <div className="my-2 border-t border-dashed border-gray-400" />;

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const data = await getReceiptData(orderId);
  if (!data) notFound();

  const v = buildReceiptView(data);

  return (
    <div className="min-h-screen bg-[#F3F2FA] py-8 px-4 print:bg-white print:p-0">
      {/* Termal fiş görünümü: sabit genişlikli yazı, kesikli ayraçlar, "*" önekli tutarlar. */}
      <div className="max-w-[340px] mx-auto bg-white shadow-[0_8px_30px_rgba(8,6,26,0.08)] px-5 py-6 font-mono text-[13px] leading-snug text-[#08061A] print:shadow-none print:max-w-none">
        <div className="text-center">
          <h1 className="text-base font-bold uppercase">{v.brand}</h1>
          {v.headerLines.map((l) => (
            <p key={l} className="text-xs">{l}</p>
          ))}
        </div>

        <div className="mt-3">
          {v.meta.map(([k, val]) => (
            <Row key={k} left={k} right={val} />
          ))}
        </div>

        <Dashed />

        <div className="space-y-1">
          {v.items.map((i, idx) => (
            <Row
              key={idx}
              left={
                <>
                  <span className="uppercase">{i.name}</span>
                  {i.detail && <span className="block text-xs text-gray-600">{i.detail}</span>}
                </>
              }
              right={
                <>
                  <span className="text-xs text-gray-600 mr-3">%{i.vatRate}</span>*{i.amount}
                </>
              }
            />
          ))}
        </div>

        <Dashed />

        {v.vatLines.map((l) => (
          <Row key={l.label} left={l.label} right={`*${l.amount}`} />
        ))}
        <Row className="font-bold" left="TOPKDV" right={`*${v.totalVat}`} />
        <Row className="font-bold text-base" left="TOPLAM" right={`*${v.total}`} />

        {v.payments.length > 0 && (
          <>
            <Dashed />
            <div className="space-y-1.5">
              {v.payments.map((p, idx) => (
                <div key={idx}>
                  <Row className="font-bold" left={p.label} right={`*${p.amount}`} />
                  {p.lines.map((l) => (
                    <p key={l} className="pl-3 text-gray-700">{l}</p>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
        {v.tip && <Row className="text-gray-600" left="BAHŞİŞ" right={`*${v.tip}`} />}
        {v.remaining && <Row className="font-bold" left="KALAN" right={`*${v.remaining}`} />}

        {v.footerLines.length > 0 && (
          <div className="mt-3 text-center text-xs">
            {v.footerLines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        )}

        <p className="mt-4 text-center">Teşekkürler</p>
        <p className="mt-4 text-center text-[11px] text-gray-500">{RECEIPT_DISCLAIMER}</p>
      </div>

      <div className="max-w-[340px] mx-auto mt-4 space-y-3 print:hidden">
        <EmailForm orderId={orderId} />
        <p className="text-xs text-gray-500 text-center">
          E-posta adresiniz sadece bu fişi göndermek için kullanılır.{" "}
          <Link href={`/gizlilik?fis=${orderId}`} className="underline">
            Gizlilik
          </Link>
        </p>
        <button
          className="w-full h-11 rounded-xl bg-[#1D126D] text-white text-sm font-medium"
          data-print-button
        >
          Yazdır
        </button>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.querySelector('[data-print-button]')?.addEventListener('click', () => window.print())`,
        }}
      />
    </div>
  );
}
