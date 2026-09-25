import { headers } from "next/headers";

let warnedMissingUrl = false;

/**
 * Sitenin dışarıdan görünen tam adresi (iyzico dönüş adresi, fiş e-postasındaki
 * linkler, QR kodları, sitemap).
 *
 * Önce APP_URL okunur: NEXT_PUBLIC_ olmadığı için build'e gömülmez, runtime'da
 * değiştirilebilir. NEXT_PUBLIC_APP_URL build anında gömülür (bkz. Dockerfile
 * ARG), geriye dönük uyumluluk için ikinci sırada.
 *
 * İkisi de yoksa istekteki Host başlığına düşülür — bu yalnızca geliştirmede
 * güvenlidir: Host başlığını istemci belirler, prod'da iyzico dönüş adresi ve
 * e-postadaki linkler başka bir alan adına yönlendirilebilir.
 */
export async function getBaseUrl() {
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production" && !warnedMissingUrl) {
    warnedMissingUrl = true;
    console.error(
      "[baseUrl] APP_URL tanımlı değil — adresler Host başlığından üretiliyor. Prod'da APP_URL=https://alanadiniz ayarlayın."
    );
  }
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
