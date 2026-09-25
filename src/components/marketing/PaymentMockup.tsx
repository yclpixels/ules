/**
 * Hero'daki ikinci telefon illüstrasyonu — ödeme/hesap bölüşme ekranı.
 * HeroMockup ile aynı gerçekçi iPhone çerçevesini (Dynamic Island, ince
 * kenarlık, yan tuşlar, cam yansıması) kullanır; ekran içeriği yine
 * wireframe teknikle çizilir, gerçek ekran görüntüsü/stok fotoğraf yok.
 */
export default function PaymentMockup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 640"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ules-amount-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f87171" />
        </linearGradient>
        <linearGradient id="ules-frame-edge-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a3a3f" />
          <stop offset="0.5" stopColor="#0c0c0e" />
          <stop offset="1" stopColor="#2a2a2e" />
        </linearGradient>
        <linearGradient id="ules-glass-sheen-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="0.25" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="ules-phone-shadow-2" x="-20%" y="-10%" width="140%" height="120%">
          <feDropShadow dx="0" dy="18" stdDeviation="24" floodColor="#000000" floodOpacity="0.45" />
        </filter>
        <clipPath id="ules-screen-clip-2">
          <rect x="12" y="12" width="296" height="616" rx="46" />
        </clipPath>
      </defs>

      <g filter="url(#ules-phone-shadow-2)">
        <rect x="2" y="2" width="316" height="636" rx="54" fill="url(#ules-frame-edge-2)" />
        <rect x="5" y="5" width="310" height="630" rx="51" fill="#0c0c0e" />
        <rect x="12" y="12" width="296" height="616" rx="46" fill="#0f0f12" />

        <rect x="-1" y="118" width="4" height="20" rx="2" fill="#1c1c1e" />
        <rect x="-1" y="150" width="4" height="42" rx="2" fill="#1c1c1e" />
        <rect x="-1" y="200" width="4" height="42" rx="2" fill="#1c1c1e" />
        <rect x="317" y="170" width="4" height="60" rx="2" fill="#1c1c1e" />
      </g>

      <g clipPath="url(#ules-screen-clip-2)">
        {/* Başlık */}
        <rect x="34" y="56" width="70" height="14" rx="4" fill="#f2f2f5" />
        <rect x="34" y="78" width="150" height="9" rx="3" fill="#8b8b96" />

        {/* Bölüşme sekmeleri */}
        <g>
          <rect x="34" y="104" width="234" height="40" rx="12" fill="#17171b" />
          <rect x="40" y="110" width="72" height="28" rx="9" fill="url(#ules-amount-gradient)" />
          <rect x="118" y="116" width="60" height="9" rx="3" fill="#8b8b96" />
          <rect x="196" y="116" width="54" height="9" rx="3" fill="#8b8b96" />
        </g>

        {/* Kişi sayısı kutusu */}
        <rect x="34" y="160" width="234" height="46" rx="12" fill="none" stroke="#27272e" strokeWidth="1.5" />
        <rect x="46" y="174" width="90" height="10" rx="3" fill="#8b8b96" />

        {/* Büyük tutar kartı */}
        <g>
          <rect x="34" y="224" width="234" height="120" rx="18" fill="#17171b" />
          <rect x="54" y="248" width="90" height="11" rx="3" fill="#8b8b96" />
          <text
            x="54"
            y="304"
            fontSize="44"
            fontWeight="700"
            fill="url(#ules-amount-gradient)"
            fontFamily="Arial, sans-serif"
          >
            ₺270,00
          </text>
        </g>

        {/* Bahşiş satırı */}
        <rect x="34" y="360" width="60" height="9" rx="3" fill="#a3a3ae" />
        <g>
          <rect x="34" y="378" width="50" height="30" rx="9" fill="none" stroke="#27272e" strokeWidth="1.5" />
          <rect x="92" y="378" width="50" height="30" rx="9" fill="url(#ules-amount-gradient)" />
          <rect x="150" y="378" width="50" height="30" rx="9" fill="none" stroke="#27272e" strokeWidth="1.5" />
          <rect x="208" y="378" width="60" height="30" rx="9" fill="none" stroke="#27272e" strokeWidth="1.5" />
        </g>

        {/* Kartla öde butonu */}
        <g>
          <rect x="18" y="524" width="284" height="90" rx="20" fill="url(#ules-amount-gradient)" />
          <rect x="40" y="550" width="20" height="20" rx="5" fill="#1f1a06" fillOpacity="0.6" />
          <rect x="70" y="556" width="120" height="12" rx="4" fill="#1f1a06" />
          <circle cx="250" cy="569" r="18" fill="#1f1a06" fillOpacity="0.6" />
        </g>

        {/* Cam yansıması */}
        <rect x="12" y="12" width="296" height="616" fill="url(#ules-glass-sheen-2)" />
      </g>

      {/* Dynamic Island */}
      <rect x="130" y="26" width="60" height="20" rx="10" fill="#000000" />
    </svg>
  );
}
