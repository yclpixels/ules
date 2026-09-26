/** Tanıtım sitesinin menüsü — üst menü, telefon menüsü ve alt bilgi buradan. */
export const NAV_LINKS = [
  { href: "/#ozellikler", label: "Özellikler" },
  { href: "/uygulama", label: "Ekranlar" },
  { href: "/ules-nedir", label: "Üleş Nedir?" },
  { href: "/sss", label: "SSS" },
  { href: "/blog", label: "Blog" },
  { href: "/iletisim", label: "İletişim" },
];

export const APPLY_HREF = "/isletme-basvur";

/** Ana sayfadayken "/#bolum" → "#bolum" (sayfa yeniden yüklenmez). */
export const navHref = (href: string, home: boolean) =>
  home && href.startsWith("/#") ? href.slice(1) : href;
