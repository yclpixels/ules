/**
 * Marka işareti: "Üleş" (bölüşmek) kavramını temsil eden, iki parçaya
 * ayrılmış bir daire — hesap bölüşmenin görsel kısaltması. Marka kırmızısı
 * (#E0233A) sitenin imza rengi olarak her yerde tekrar eder.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#E0233A" />
      <path d="M16 2a14 14 0 0 1 0 28z" fill="black" fillOpacity="0.15" />
      <path d="M16 6v20M16 6a10 10 0 0 1 0 20" stroke="black" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
