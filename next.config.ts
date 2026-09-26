import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // iyzipay dosya sistemini okuyup dinamik require yapıyor; Turbopack/webpack
  // bunu statik olarak bundle edemez, native Node.js require'a bırakıyoruz.
  serverExternalPackages: ["iyzipay"],
  // Docker/VPS gibi hosting'e bağımsız dağıtım için minimal bir çalışma
  // klasörü üretir (bkz. Dockerfile). Hangi barındırma sağlayıcısını
  // seçerseniz seçin aynı image çalışır — tek bir platforma kilitlenmez.
  output: "standalone",
  // Sürüm uyuşmazlığı koruması: sayfa eski sürümden açıkken yeni sürüm
  // yayına girerse, eski form/düğme kimliklerini sunucu tanımıyor ve genel
  // hata ekranı çıkıyordu. Kimlik değişince Next.js hata yerine sayfayı
  // kendisi yeniler. Railway commit kimliğini build'e verir (bkz. Dockerfile);
  // yerelde tanımsız kalır ve bu koruma devre dışıdır.
  deploymentId: process.env.RAILWAY_GIT_COMMIT_SHA || undefined,
  // iyzipay'in dinamik require ettiği kaynak dosyalar Next.js'in statik
  // dosya izlemesi (file tracing) tarafından bazen atlanabiliyor; standalone
  // build'e paketin tamamını dahil ederek bunu garanti altına alıyoruz.
  // NOT: Bu proje ortamında Docker kurulu olmadığı için standalone build
  // uçtan uca test edilemedi — ilk Docker build'inizde iyzico ödeme akışını
  // mutlaka deneyin.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/iyzipay/**/*"],
  },
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ...(process.env.NODE_ENV === "production"
        ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
        : []),
    ];
    return [
      {
        // Varsayılan: sayfalar yalnızca kendi sitemizde iframe'e alınabilir
        // (tanıtım sayfası canlı menü önizlemesini gömüyor). Başka bir site
        // admin panelini görünmez bir iframe'e koyup personele tıklatamaz
        // (clickjacking). X-Frame-Options yerine CSP kullanılıyor çünkü
        // aşağıda /menu için geçersiz kılınabilmesi gerekiyor.
        source: "/:path*",
        headers: [
          ...common,
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
      {
        // Herkese açık menü işletmelerin kendi sitelerine gömülmek için var
        // (bkz. /admin/ayarlar embed kodu). Aynı anahtar sonradan tanımlandığı
        // için yukarıdakinin yerine geçer.
        source: "/menu/:slug*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }],
      },
    ];
  },
};

export default nextConfig;
