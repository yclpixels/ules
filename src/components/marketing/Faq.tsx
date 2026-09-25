/**
 * Sık sorulan sorular — yerleşik <details> ile açılır/kapanır; JavaScript
 * gerekmez, klavyeyle ve ekran okuyucuyla çalışır.
 */
export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.q}
          className="group rounded-2xl px-5 sm:px-6"
          style={{ background: "#ffffff", border: "1px solid #E7E5F4" }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform group-open:rotate-45"
              style={{ background: "#F3F2FA", color: "#1D126D" }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <p className="pb-5 -mt-1 leading-relaxed" style={{ color: "#5B5B72" }}>
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
