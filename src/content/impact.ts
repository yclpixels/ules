/**
 * /etki sayfasının rakamları. GERÇEK ve ÖLÇÜLMÜŞ veri girilene kadar `value`
 * null kalır; sayfa "ölçülüyor" gösterir ve arama motorlarına kapalıdır.
 * Rakam girildiğinde `asOf` (hangi tarih itibarıyla) doldurulmalı.
 */
export type ImpactStat = {
  label: string;
  /** Nasıl ölçüldüğü — sayfada rakamın altında görünür. */
  method: string;
  value: number | null;
  suffix?: string;
};

export const impact = {
  /** YYYY-AA-GG — rakamların hangi tarih itibarıyla olduğu. */
  asOf: null as string | null,
  stats: [
    { label: "Masada kapanan hesap", method: "Ödemesi tamamlanıp kendiliğinden kapanan hesaplar", value: null },
    { label: "Aktif işletme", method: "Son 30 günde en az bir hesap kapatan şubeler", value: null },
    { label: "QR ile verilen sipariş", method: "Müşterinin kendi telefonundan gönderdiği siparişler", value: null },
    { label: "Dijital fiş", method: "Kâğıt yerine ekranda görüntülenen ya da e-postayla gönderilen fişler", value: null },
  ] as ImpactStat[],
};

export const hasImpactData = () => impact.stats.some((s) => s.value !== null);
