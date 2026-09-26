/**
 * Hukuk kontrolünden geçmemiş metinlerin üstündeki uyarı. Metin bir avukat
 * tarafından gözden geçirildiğinde sayfadan kaldırılmalı — ziyaretçiye
 * hukuki danışmanlık alınmış gibi görünmemesi için bilerek görünür.
 */
export default function LegalDraftNotice() {
  const legalName = process.env.PLATFORM_LEGAL_NAME?.trim();
  return (
    <p className="mb-8 rounded-xl border border-[#fde68a] bg-[#fef3c7] p-4 text-sm leading-relaxed text-[#92400e]">
      Bu metin taslaktır ve henüz hukuk kontrolünden geçmemiştir.
      {!legalName && " Şirket unvanı (PLATFORM_LEGAL_NAME) girildiğinde veri sorumlusu bilgisi tamamlanacaktır."}{" "}
      Sorularınız için bize yazabilirsiniz.
    </p>
  );
}
