/**
 * Hero'daki telefon illüstrasyonu. Gerçek bir ekran görüntüsü/stok fotoğraf
 * yerine elle çizilmiş SVG kullanılıyor: dışarıdan görsel/lisans bağımlılığı
 * yok, anında yüklenir. Çerçeve gerçekçi bir iPhone'u (Dynamic Island, ince
 * kenarlık, yan tuşlar, hafif cam yansıması) taklit eder; ekran içeriği ise
 * gerçek uygulamanın (açık tema, marka kırmızısı #E0233A) yapısını dürüstçe
 * temsil eden soyut çizgilerle (wireframe) gösterilir — font/gerçek ekran
 * görüntüsü kullanılmıyor.
 */
export default function HeroMockup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 640"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ules-frame-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a3a3f" />
          <stop offset="0.5" stopColor="#0c0c0e" />
          <stop offset="1" stopColor="#2a2a2e" />
        </linearGradient>
        <filter id="ules-phone-shadow" x="-20%" y="-10%" width="140%" height="120%">
          <feDropShadow dx="0" dy="18" stdDeviation="24" floodColor="#000000" floodOpacity="0.35" />
        </filter>
        <clipPath id="ules-screen-clip-1">
          <rect x="12" y="12" width="296" height="616" rx="46" />
        </clipPath>
      </defs>

      <g filter="url(#ules-phone-shadow)">
        {/* iPhone gövdesi — titanyum kenarlık hissi için ince gradyan çerçeve */}
        <rect x="2" y="2" width="316" height="636" rx="54" fill="url(#ules-frame-edge)" />
        <rect x="5" y="5" width="310" height="630" rx="51" fill="#0c0c0e" />
        {/* Ekran */}
        <rect x="12" y="12" width="296" height="616" rx="46" fill="#ffffff" />

        {/* Yan tuşlar */}
        <rect x="-1" y="118" width="4" height="20" rx="2" fill="#1c1c1e" />
        <rect x="-1" y="150" width="4" height="42" rx="2" fill="#1c1c1e" />
        <rect x="-1" y="200" width="4" height="42" rx="2" fill="#1c1c1e" />
        <rect x="317" y="170" width="4" height="60" rx="2" fill="#1c1c1e" />
      </g>

      <g clipPath="url(#ules-screen-clip-1)">
        {/* Başlık */}
        <rect x="34" y="56" width="90" height="14" rx="4" fill="#0a0a0a" />
        <rect x="34" y="78" width="140" height="9" rx="3" fill="#9ca3af" />

        {/* Sekmeler */}
        <rect x="34" y="102" width="120" height="32" rx="10" fill="#E0233A" />
        <rect x="158" y="102" width="110" height="32" rx="10" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />

        {/* Kategori başlığı */}
        <rect x="34" y="154" width="80" height="9" rx="3" fill="#6b7280" />

        {/* Ürün kartı 1 — tabak ikonu */}
        <g>
          <rect x="34" y="174" width="234" height="86" rx="14" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <rect x="46" y="186" width="62" height="62" rx="14" fill="#E0233A" />
          <circle cx="77" cy="217" r="17" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2.5" />
          <circle cx="77" cy="217" r="9" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" />
          <rect x="120" y="196" width="100" height="11" rx="3" fill="#0a0a0a" />
          <rect x="120" y="216" width="60" height="9" rx="3" fill="#9ca3af" />
          <rect x="216" y="204" width="40" height="26" rx="8" fill="#fafafa" />
        </g>

        {/* Ürün kartı 2 — bardak ikonu */}
        <g>
          <rect x="34" y="270" width="234" height="60" rx="12" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <rect x="46" y="280" width="40" height="40" rx="10" fill="#E0233A" />
          <path d="M58 290h16l-2 20h-12z" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" />
          <rect x="98" y="290" width="90" height="11" rx="3" fill="#0a0a0a" />
          <rect x="98" y="308" width="50" height="9" rx="3" fill="#9ca3af" />
          <rect x="216" y="290" width="40" height="26" rx="8" fill="#fafafa" />
        </g>

        {/* Ürün kartı 3 — tatlı dilimi ikonu */}
        <g>
          <rect x="34" y="340" width="234" height="60" rx="12" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <rect x="46" y="350" width="40" height="40" rx="10" fill="#E0233A" />
          <path d="M56 376l10-18 10 18z" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" />
          <rect x="98" y="360" width="80" height="11" rx="3" fill="#0a0a0a" />
          <rect x="98" y="378" width="50" height="9" rx="3" fill="#9ca3af" />
          <rect x="216" y="360" width="40" height="26" rx="8" fill="#fafafa" />
        </g>

        {/* Sepet çubuğu (marka kırmızısı) */}
        <g>
          <rect x="18" y="524" width="284" height="90" rx="20" fill="#E0233A" />
          <rect x="40" y="550" width="70" height="10" rx="3" fill="#ffffff" fillOpacity="0.75" />
          <rect x="40" y="570" width="110" height="14" rx="4" fill="#ffffff" />
          <rect x="200" y="556" width="80" height="34" rx="10" fill="#ffffff" />
        </g>
      </g>

      {/* Dynamic Island */}
      <rect x="130" y="26" width="60" height="20" rx="10" fill="#000000" />
    </svg>
  );
}
