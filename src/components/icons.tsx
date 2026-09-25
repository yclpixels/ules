/**
 * Uygulama genelinde (tanıtım sitesi + müşteri ekranı) kullanılan, elle
 * çizilmiş minimal çizgi ikonlar. Hazır bir ikon kütüphanesi eklemek yerine
 * (gereksiz bağımlılık) inline SVG kullanılıyor — hepsi tek stil: 24x24,
 * strokeWidth 1.5, currentColor.
 */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function QrIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14h1v1h-1zM14 20h1v1h-1zM17.5 17.5h1v1h-1zM20 20h1v1h-1z" />
    </svg>
  );
}

/** Yarısı dolu, yarısı boş daire — "ikiye bölündü" anlamını küçük boyutta
 * bile net veren klasik "pasta dilimi" motifi. Önceki iki-yarım-daire
 * denemesi 44px rozet içinde neredeyse görünmez kaldığı için değiştirildi. */
export function SplitIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </svg>
  );
}

/** Onay kutulu liste — ClipboardIcon'dan (tekil rapor/kayıt) kasıtlı olarak
 * farklı: burada "listeden seç" anlamı var. */
export function ListChecksIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4.5" width="4" height="4" rx="1" />
      <path d="M4 6.5l0.8 0.8L6 6" />
      <path d="M10.5 6.5h10" />
      <rect x="3" y="10.5" width="4" height="4" rx="1" />
      <path d="M10.5 12.5h10" />
      <rect x="3" y="16.5" width="4" height="4" rx="1" />
      <path d="M4 18.5l0.8 0.8L6 18" />
      <path d="M10.5 18.5h10" />
    </svg>
  );
}

/** Genel/marka bağımsız kart simgesi — ödeme bölümünde kullanılır. */
export function CardIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 9.5h20" />
      <path d="M6 14.5h4" />
    </svg>
  );
}

export function ShieldIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function BellIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ImageIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5.5-5.5L3 20" />
    </svg>
  );
}

export function CodeIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <path d="M9 8l-5 4 5 4M15 8l5 4-5 4" />
    </svg>
  );
}

export function BuildingIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <path d="M4 21V7l8-4 8 4v14" />
      <path d="M4 21h16M9 21v-6h6v6M9 11h.01M15 11h.01M9 7h.01M15 7h.01" />
    </svg>
  );
}

export function ClipboardIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function CheckCircleIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5" />
    </svg>
  );
}

export function WalletIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path d="M16 12h3v3h-3a1.5 1.5 0 0 1 0-3z" />
      <path d="M3 8h14" />
    </svg>
  );
}

export function ReceiptIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5z" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </svg>
  );
}

export function CartIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20.5 8H6" />
    </svg>
  );
}

export function UsersIcon(props: { className?: string }) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M18.5 14.3c1.9.6 3.5 2.7 3.5 5.7" />
    </svg>
  );
}
