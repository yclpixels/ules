/**
 * Blog yazıları. Yeni yazı = bu listeye bir nesne eklemek; sayfa, site
 * haritası ve yapılandırılmış veri kendiliğinden güncellenir.
 *
 * Kural: kaynağı gösterilemeyen istatistik yazılmaz. Rakam kullanılacaksa
 * `sources` alanına kaynağın bağlantısı eklenir ve metinde atıf yapılır.
 */
export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "note"; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  /** Arama sonucu açıklaması (~155 karakter). */
  description: string;
  category: BlogCategory;
  /** YYYY-AA-GG */
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  body: BlogBlock[];
  sources?: { label: string; url: string }[];
};

export const BLOG_CATEGORIES = [
  "Rehber",
  "Restoran işletmeciliği",
  "Sürdürülebilirlik",
  "Üleş haberleri",
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const blogPosts: BlogPost[] = [
  {
    slug: "qr-menu-nedir",
    title: "QR Menü Nedir? Restoran ve Kafeler İçin Kısa Rehber",
    description:
      "QR menü nasıl çalışır, basılı menüden farkı ne, restoran ve kafelere ne kazandırır? Geçmeden önce bilmeniz gerekenleri sade bir dille anlattık.",
    category: "Rehber",
    publishedAt: "2026-09-27",
    readingMinutes: 5,
    body: [
      {
        type: "p",
        text: "QR menü, masadaki küçük bir karekodun müşterinin telefonunda işletmenin menüsünü açmasıdır. Müşteri kamerayı koda tutar, bir bağlantı çıkar, dokunur ve menü tarayıcıda açılır. Uygulama indirmek ya da üye olmak gerekmez.",
      },
      { type: "h2", text: "Basılı menüden farkı ne?" },
      {
        type: "p",
        text: "Basılı menü bir kez basılır ve fiyat değiştiğinde yeniden basılması gerekir. QR menü ise panelden güncellenir: fiyatı değiştirdiğiniz ya da bir ürünü \"tükendi\" yaptığınız anda masadaki herkes güncel hâlini görür.",
      },
      {
        type: "ul",
        items: [
          "Fiyat ve ürün değişikliği için yeniden baskı gerekmez.",
          "Ürün fotoğrafı, açıklama ve alerjen bilgisi eklenebilir.",
          "Turist müşteriler menüyü kendi dilinde görebilir.",
          "Biten ürün menüden anında kalkar; müşteri olmayan bir şeyi sipariş etmez.",
        ],
      },
      { type: "h2", text: "Sadece menü mü, sipariş ve ödeme de mi?" },
      {
        type: "p",
        text: "QR menü sistemleri üç seviyede kullanılır. En basiti yalnızca menüyü göstermektir. İkinci seviyede müşteri siparişini kendisi verir ve sipariş doğrudan mutfak ekranına düşer. Üçüncü seviyede müşteri hesabını masadan görür, arkadaşlarıyla bölüşür ve payını öder.",
      },
      {
        type: "p",
        text: "Hepsini birden açmak zorunda değilsiniz. Birçok işletme önce menü ve hesap görüntüleme ile başlar; personel ve müşteriler alıştıkça sipariş ve ödemeyi açar.",
      },
      { type: "h2", text: "QR menüye geçerken dikkat edilecekler" },
      {
        type: "ol",
        items: [
          "QR kodun kalıcı olması: masa kartları bir kez basılır, kodun sonradan değişmemesi gerekir.",
          "Menünün hızlı açılması: müşteri masada bekler; ağır bir sayfa ilk izlenimi bozar.",
          "Personelin de sistemi kullanabilmesi: telefonu olmayan ya da QR okutmak istemeyen müşteri için garson siparişi aynı hesaba girebilmeli.",
          "Ödeme güvenliği: kart bilgisi lisanslı bir ödeme kuruluşunun formuna girilmeli, işletmenin sunucusuna gelmemeli.",
          "Basılı menüyü tamamen kaldırmamak: isteyen müşteri için birkaç basılı menü bulundurmak iyi bir uygulamadır.",
        ],
      },
      {
        type: "note",
        text: "Üleş'te QR kodu her masa için bir kez üretilir ve değişmez; masa adını değiştirmek kodu bozmaz. Menü, sipariş ve ödeme ayrı ayrı açılıp kapatılabilir.",
      },
    ],
  },
  {
    slug: "restoranda-hesap-bolusme",
    title: "Restoranda Hesap Bölüşme: Masada Ödeme Nasıl Çalışır?",
    description:
      "Kalabalık masalarda hesap bölüşmek neden zaman alır, dijital hesap bölüşme nasıl işler? Eşit bölme, kalem seçme ve tutar girme yöntemleri.",
    category: "Restoran işletmeciliği",
    publishedAt: "2026-09-27",
    readingMinutes: 4,
    body: [
      {
        type: "p",
        text: "Kalabalık bir masa kalkmak istediğinde çoğu zaman aynı sahne yaşanır: hesap istenir, garson adisyonu getirir, kim ne yedi hesaplanır, birkaç kart ve biraz nakit toplanır, POS cihazı masalar arasında dolaşır. Bu süre boyunca masa boşalmaz ve garson başka masaya bakamaz.",
      },
      { type: "h2", text: "Dijital hesap bölüşme nasıl işler?" },
      {
        type: "p",
        text: "Masadaki QR kodu okutan herkes aynı hesabı kendi telefonunda canlı görür. Her kişi kendi payını seçer ve öder; ödenen tutar anında düşer, kalan tutar herkesin ekranında güncellenir. Hesabın tamamı ödendiğinde hesap kendiliğinden kapanır.",
      },
      { type: "h2", text: "Üç bölüşme yöntemi" },
      {
        type: "ul",
        items: [
          "Eşit bölme: toplam tutar kişi sayısına bölünür. Arkadaş grupları için en hızlısı.",
          "Kalem seçme: herkes yediği ürünleri işaretler. Aynı kalem iki kişi tarafından ödenemez.",
          "Tutar girme: \"ben 300 TL veriyorum\" diyen kişi istediği tutarı öder, kalanı diğerleri paylaşır.",
        ],
      },
      { type: "h2", text: "Bahşiş ne olur?" },
      {
        type: "p",
        text: "İyi bir sistemde bahşiş hesaptan ayrı tutulur: müşteri payını öderken isterse bahşiş ekler, bahşiş ciroya karışmaz ve gün sonu raporunda ayrı satırda görünür.",
      },
      { type: "h2", text: "Kartla ödemek istemeyen müşteri" },
      {
        type: "p",
        text: "Masadaki herkes telefondan ödemek zorunda değildir. Nakit ya da POS cihazıyla ödeyen kişinin payını garson aynı hesaba işler; kalan tutar yine herkesin ekranında güncellenir.",
      },
      {
        type: "note",
        text: "Üleş'te kartlı ödemeler iyzico'nun lisanslı altyapısıyla doğrudan işletmenin hesabına yapılır; kart bilgisi Üleş'e ya da işletmeye gelmez.",
      },
    ],
  },
  {
    slug: "restoranlarda-gida-israfi",
    title: "Restoranlarda Gıda İsrafı Nasıl Azaltılır? 5 Pratik Yol",
    description:
      "Restoran ve kafelerde gıda israfını azaltmanın uygulanabilir yolları: menü planlama, porsiyon, stok takibi, tükendi bilgisi ve gün sonu verisi.",
    category: "Sürdürülebilirlik",
    publishedAt: "2026-09-27",
    readingMinutes: 5,
    body: [
      {
        type: "p",
        text: "Gıda israfı hem çevre hem de işletmenin kârı için önemli bir kalemdir: çöpe giden her porsiyon, satın alınmış ama satılamamış bir üründür. İyi haber şu ki israfın büyük bölümü birkaç alışkanlıkla azaltılabilir.",
      },
      { type: "h2", text: "1. Menüyü sadeleştirin" },
      {
        type: "p",
        text: "Az satılan ürünler için stok tutmak israfın en yaygın sebeplerinden biridir. Satış verinize bakın; nadiren sipariş edilen ve özel malzeme gerektiren ürünleri menüden çıkarmayı ya da yalnızca belirli günlerde sunmayı düşünün.",
      },
      { type: "h2", text: "2. Porsiyonları ölçün" },
      {
        type: "p",
        text: "Masalardan sürekli yarım dönen bir ürün varsa porsiyon büyük olabilir. Mutfakla birlikte hangi tabakların artık yemekle döndüğünü birkaç hafta not edin; porsiyonu küçültmek ya da iki boy seçenek sunmak hem israfı hem maliyeti düşürür.",
      },
      { type: "h2", text: "3. Biten ürünü anında menüden kaldırın" },
      {
        type: "p",
        text: "Müşterinin bitmiş bir ürünü sipariş etmesi, mutfakta son anda ikame yemek hazırlanmasına ve çoğu zaman memnuniyetsizliğe yol açar. Dijital menüde ürünü \"tükendi\" yapmak onu anında görünmez kılar.",
      },
      { type: "h2", text: "4. Müşteri notlarını mutfağa doğru iletin" },
      {
        type: "p",
        text: "\"Soğansız\", \"az pişmiş\" gibi notlar yanlış iletildiğinde tabak geri döner ve yeniden hazırlanır. Notun siparişle birlikte doğrudan mutfak ekranına düşmesi bu tür hataları azaltır.",
      },
      { type: "h2", text: "5. Gün sonu verisine bakın" },
      {
        type: "p",
        text: "Hangi ürünün hangi gün ne kadar sattığını bilmek, ertesi günün hazırlığını doğru planlamanın temelidir. Hafta içi ve hafta sonu farklarını, yağmurlu günleri, özel günleri not edin; hazırlık miktarını tahmine değil veriye göre yapın.",
      },
      {
        type: "note",
        text: "Üleş'te ürünler tek dokunuşla \"tükendi\" yapılır ve menüden anında kalkar; müşteri notları mutfak ekranına siparişle birlikte düşer.",
      },
    ],
  },
  {
    slug: "masadan-siparise-gecis",
    title: "Masadan Sipariş Sistemine Geçerken Dikkat Edilecek 6 Şey",
    description:
      "Restoranınızda QR ile masadan sipariş sistemine geçmeden önce personel, mutfak, ödeme ve müşteri deneyimi açısından kontrol etmeniz gerekenler.",
    category: "Restoran işletmeciliği",
    publishedAt: "2026-09-27",
    readingMinutes: 4,
    body: [
      {
        type: "p",
        text: "Masadan sipariş sistemi, iyi kurulduğunda garsonun yükünü hafifletir ve siparişin mutfağa ulaşma süresini kısaltır. Kötü kurulduğunda ise hem personeli hem müşteriyi yorar. Geçişten önce şu altı noktayı kontrol edin.",
      },
      { type: "h2", text: "1. Personel ve müşteri siparişi aynı hesapta mı?" },
      {
        type: "p",
        text: "Bazı müşteriler QR ile, bazıları garsona sipariş verir. İki siparişin ayrı yerlerde tutulması hesap karmaşasına yol açar; hepsi tek hesapta birleşmelidir.",
      },
      { type: "h2", text: "2. Mutfak siparişi nasıl görecek?" },
      {
        type: "p",
        text: "Siparişin mutfağa kâğıtla mı, ekranla mı ulaşacağını baştan belirleyin. Ekran kullanılacaksa yeni siparişte sesli uyarı ve bekleme süresi görünmesi, yoğun saatlerde öncelik vermeyi kolaylaştırır.",
      },
      { type: "h2", text: "3. Yanlışlıkla verilen sipariş" },
      {
        type: "p",
        text: "Müşterinin menüde gezinirken yanlışlıkla bir ürünü mutfağa göndermemesi gerekir. Sepet mantığı — önce seç, sonra tek seferde gönder — bu sorunu çözer.",
      },
      { type: "h2", text: "4. Kartlı ödeme hazır mı?" },
      {
        type: "p",
        text: "Masadan ödeme için lisanslı bir ödeme kuruluşuyla anlaşma gerekir. Hazır değilseniz sipariş ve hesap görüntülemeyle başlayıp ödemeyi sonra açabilirsiniz.",
      },
      { type: "h2", text: "5. Personel eğitimi" },
      {
        type: "p",
        text: "Garsonlar sistemi müşteriden önce öğrenmeli: QR'ın ne işe yaradığını anlatabilmeli, nakit ya da POS ödemesini hesaba işleyebilmeli, hesabı iptal etmenin kurallarını bilmeli.",
      },
      { type: "h2", text: "6. Kayıt ve hesap verebilirlik" },
      {
        type: "p",
        text: "Kim hangi ürünü ekledi, kim sildi, kim nakit aldı? Bu soruların cevabı sistemde kayıtlı olmalı. Hem kasa farklarını açıklamak hem de personel performansını adil değerlendirmek için gereklidir.",
      },
    ],
  },
];

export function getPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}

/** Yeniden eskiye. */
export function sortedPosts() {
  return [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
export function formatPostDate(ymd: string) {
  return dateFmt.format(new Date(`${ymd}T12:00:00Z`));
}
