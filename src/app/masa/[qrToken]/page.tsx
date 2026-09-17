import { Suspense } from "react";
import BillView from "./BillView";

export default async function MasaPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;
  const isDemo = process.env.PAYMENT_PROVIDER !== "iyzico";

  return (
    <Suspense fallback={null}>
      <BillView qrToken={qrToken} isDemo={isDemo} />
    </Suspense>
  );
}
