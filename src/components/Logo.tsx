/**
 * Marka işareti: iki kişiyi (masadaki müşterileri) ve aralarındaki gülen
 * yüzü — birlikte, sorunsuz paylaşılan bir hesabı — temsil eder. Kullanıcının
 * kendisi için özel ürettirdiği bir tasarımın marka kırmızısına (#E0233A,
 * koyu/açık iki ton) uyarlanmış, cam/gradyan efektsiz düz (flat) hâli.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 260" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="35" y="80" width="55" height="150" rx="27" fill="#E0233A" />
      <rect x="110" y="70" width="55" height="160" rx="27" fill="#b91c2e" />
      <circle cx="62" cy="38" r="28" fill="#E0233A" />
      <circle cx="137" cy="34" r="24" fill="#b91c2e" />
      <path
        d="M55 190 Q100 232 148 188"
        stroke="#ffffff"
        strokeWidth="16"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
