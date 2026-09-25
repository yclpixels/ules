/**
 * Hero'daki ikinci telefon illüstrasyonu — ödeme/hesap bölüşme ekranı.
 * HeroMockup (menü ekranı) ile birlikte iki telefonun üst üste bindiği
 * bir kompozisyon oluşturmak için var; aynı wireframe tekniği ve marka
 * gradyanı kullanılıyor, gerçek ekran görüntüsü/stok fotoğraf yok.
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
        <filter id="ules-phone-shadow-2" x="-20%" y="-10%" width="140%" height="120%">
          <feDropShadow dx="0" dy="18" stdDeviation="24" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      <g filter="url(#ules-phone-shadow-2)">
        <rect x="4" y="4" width="312" height="632" rx="36" fill="#161619" stroke="#e9e9ee" strokeOpacity="0.15" strokeWidth="2" />
        <rect x="18" y="30" width="284" height="580" rx="20" fill="#0f0f12" />
        <rect x="132" y="16" width="56" height="8" rx="4" fill="#000" fillOpacity="0.5" />
      </g>

      {/* Başlık */}
      <rect x="34" y="52" width="70" height="14" rx="4" fill="#f2f2f5" />
      <rect x="34" y="74" width="150" height="9" rx="3" fill="#8b8b96" />

      {/* Bölüşme sekmeleri */}
      <g>
        <rect x="34" y="100" width="234" height="40" rx="12" fill="#17171b" />
        <rect x="40" y="106" width="72" height="28" rx="9" fill="url(#ules-amount-gradient)" />
        <rect x="118" y="112" width="60" height="9" rx="3" fill="#8b8b96" />
        <rect x="196" y="112" width="54" height="9" rx="3" fill="#8b8b96" />
      </g>

      {/* Kişi sayısı kutusu */}
      <rect x="34" y="156" width="234" height="46" rx="12" fill="none" stroke="#27272e" strokeWidth="1.5" />
      <rect x="46" y="170" width="90" height="10" rx="3" fill="#8b8b96" />

      {/* Büyük tutar kartı — Midas'ın "Yatırım ₺534.833,74" kartına karşılık */}
      <g>
        <rect x="34" y="220" width="234" height="120" rx="18" fill="#17171b" />
        <rect x="54" y="244" width="90" height="11" rx="3" fill="#8b8b96" />
        <text
          x="54"
          y="300"
          fontSize="44"
          fontWeight="700"
          fill="url(#ules-amount-gradient)"
          fontFamily="Arial, sans-serif"
        >
          ₺270,00
        </text>
      </g>

      {/* Bahşiş satırı */}
      <rect x="34" y="356" width="60" height="9" rx="3" fill="#a3a3ae" />
      <g>
        <rect x="34" y="374" width="50" height="30" rx="9" fill="none" stroke="#27272e" strokeWidth="1.5" />
        <rect x="92" y="374" width="50" height="30" rx="9" fill="url(#ules-amount-gradient)" />
        <rect x="150" y="374" width="50" height="30" rx="9" fill="none" stroke="#27272e" strokeWidth="1.5" />
        <rect x="208" y="374" width="60" height="30" rx="9" fill="none" stroke="#27272e" strokeWidth="1.5" />
      </g>

      {/* Kartla öde butonu */}
      <g>
        <rect x="18" y="520" width="284" height="90" rx="20" fill="url(#ules-amount-gradient)" />
        <rect x="40" y="546" width="20" height="20" rx="5" fill="#1f1a06" fillOpacity="0.6" />
        <rect x="70" y="552" width="120" height="12" rx="4" fill="#1f1a06" />
        <circle cx="250" cy="565" r="18" fill="#1f1a06" fillOpacity="0.6" />
      </g>
    </svg>
  );
}
