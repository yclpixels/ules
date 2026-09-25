/**
 * Hero'daki telefon illüstrasyonu. Gerçek bir ekran görüntüsü/stok fotoğraf
 * yerine elle çizilmiş SVG kullanılıyor: dışarıdan görsel/lisans bağımlılığı
 * yok, anında yüklenir, ve gerçek uygulamanın yapısını (masa başlığı, ürün
 * satırları, sepet çubuğu) dürüstçe temsil eder — metin yerine soyut
 * çizgiler kullanılıyor (klasik wireframe tekniği), font yükleme derdi yok.
 * Ürün görselleri sitenin imza gün batımı gradyanıyla (amber → kırmızı)
 * boyanmış basit tabak/bardak/tatlı ikonları — flat, sıcak, marka rengiyle tutarlı.
 */
export default function HeroMockup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 640"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ules-food-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f87171" />
        </linearGradient>
        <filter id="ules-phone-shadow" x="-20%" y="-10%" width="140%" height="120%">
          <feDropShadow dx="0" dy="18" stdDeviation="24" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      <g filter="url(#ules-phone-shadow)">
        {/* Telefon gövdesi */}
        <rect x="4" y="4" width="312" height="632" rx="36" fill="#161619" stroke="#e9e9ee" strokeOpacity="0.15" strokeWidth="2" />
        {/* Ekran */}
        <rect x="18" y="30" width="284" height="580" rx="20" fill="#0f0f12" />
        {/* Üst çentik */}
        <rect x="132" y="16" width="56" height="8" rx="4" fill="#000" fillOpacity="0.5" />
      </g>

      {/* Başlık */}
      <rect x="34" y="52" width="90" height="14" rx="4" fill="#f2f2f5" />
      <rect x="34" y="74" width="140" height="9" rx="3" fill="#8b8b96" />

      {/* Sekmeler */}
      <rect x="34" y="98" width="120" height="32" rx="10" fill="#e9e9ee" />
      <rect x="158" y="98" width="110" height="32" rx="10" fill="none" stroke="#27272e" strokeWidth="1.5" />

      {/* Kategori başlığı */}
      <rect x="34" y="150" width="80" height="9" rx="3" fill="#a3a3ae" />

      {/* Ürün kartı 1 — tabak ikonu */}
      <g>
        <rect x="34" y="170" width="234" height="86" rx="14" fill="none" stroke="#27272e" strokeWidth="1.5" />
        <rect x="46" y="182" width="62" height="62" rx="14" fill="url(#ules-food-gradient)" />
        <circle cx="77" cy="213" r="17" fill="none" stroke="#161619" strokeOpacity="0.35" strokeWidth="2.5" />
        <circle cx="77" cy="213" r="9" fill="none" stroke="#161619" strokeOpacity="0.35" strokeWidth="2" />
        <rect x="120" y="192" width="100" height="11" rx="3" fill="#f2f2f5" />
        <rect x="120" y="212" width="60" height="9" rx="3" fill="#a3a3ae" />
        <rect x="216" y="200" width="40" height="26" rx="8" fill="#e9e9ee" />
      </g>

      {/* Ürün kartı 2 — bardak ikonu */}
      <g>
        <rect x="34" y="266" width="234" height="60" rx="12" fill="none" stroke="#27272e" strokeWidth="1.5" />
        <rect x="46" y="276" width="40" height="40" rx="10" fill="url(#ules-food-gradient)" />
        <path d="M58 286h16l-2 20h-12z" fill="none" stroke="#161619" strokeOpacity="0.35" strokeWidth="2" strokeLinejoin="round" />
        <rect x="98" y="286" width="90" height="11" rx="3" fill="#f2f2f5" />
        <rect x="98" y="304" width="50" height="9" rx="3" fill="#a3a3ae" />
        <rect x="216" y="286" width="40" height="26" rx="8" fill="#e9e9ee" />
      </g>

      {/* Ürün kartı 3 — tatlı dilimi ikonu */}
      <g>
        <rect x="34" y="336" width="234" height="60" rx="12" fill="none" stroke="#27272e" strokeWidth="1.5" />
        <rect x="46" y="346" width="40" height="40" rx="10" fill="url(#ules-food-gradient)" />
        <path d="M56 372l10-18 10 18z" fill="none" stroke="#161619" strokeOpacity="0.35" strokeWidth="2" strokeLinejoin="round" />
        <rect x="98" y="356" width="80" height="11" rx="3" fill="#f2f2f5" />
        <rect x="98" y="374" width="50" height="9" rx="3" fill="#a3a3ae" />
        <rect x="216" y="356" width="40" height="26" rx="8" fill="#e9e9ee" />
      </g>

      {/* Sepet çubuğu (gün batımı gradyanı) */}
      <g>
        <rect x="18" y="520" width="284" height="90" rx="20" fill="url(#ules-food-gradient)" />
        <rect x="40" y="546" width="70" height="10" rx="3" fill="#1f1a06" fillOpacity="0.55" />
        <rect x="40" y="566" width="110" height="14" rx="4" fill="#1f1a06" />
        <rect x="200" y="552" width="80" height="34" rx="10" fill="#1f1a06" />
      </g>
    </svg>
  );
}
