"use client";

/**
 * Geri alınamayan işlemler (hesap iptali, ürün/masa silme, ödeme iptali) için
 * onay soran submit butonu. Yoğun serviste tek yanlış dokunuş hesabı silmesin.
 */
export default function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
