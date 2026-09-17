import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // iyzipay dosya sistemini okuyup dinamik require yapıyor; Turbopack/webpack
  // bunu statik olarak bundle edemez, native Node.js require'a bırakıyoruz.
  serverExternalPackages: ["iyzipay"],
  // Docker/VPS gibi hosting'e bağımsız dağıtım için minimal bir çalışma
  // klasörü üretir (bkz. Dockerfile). Hangi barındırma sağlayıcısını
  // seçerseniz seçin aynı image çalışır — tek bir platforma kilitlenmez.
  output: "standalone",
  // iyzipay'in dinamik require ettiği kaynak dosyalar Next.js'in statik
  // dosya izlemesi (file tracing) tarafından bazen atlanabiliyor; standalone
  // build'e paketin tamamını dahil ederek bunu garanti altına alıyoruz.
  // NOT: Bu proje ortamında Docker kurulu olmadığı için standalone build
  // uçtan uca test edilemedi — ilk Docker build'inizde iyzico ödeme akışını
  // mutlaka deneyin.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/iyzipay/**/*"],
  },
};

export default nextConfig;
