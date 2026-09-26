/**
 * Sık sorulan sorular — /sss sayfası ve ana sayfadaki kısa liste buradan.
 * Cevaplar ürünün BUGÜN yaptığı şeyleri anlatır; yeni özellik gelmeden
 * cevap değiştirilmemeli (FAQPage yapılandırılmış verisine de giriyor).
 */
export type FaqItem = { q: string; a: string };

export const faqGroups: { id: string; title: string; items: FaqItem[] }[] = [
  {
    id: "genel",
    title: "Genel",
    items: [
      {
        q: "Üleş nedir?",
        a: "Üleş, restoran ve kafeler için QR menü, masadan sipariş, hesap bölüşme ve ödeme sistemidir. Müşteri masadaki QR kodu okutur; menüyü görür, sipariş verir, hesabı arkadaşlarıyla bölüşür ve payını öder. İşletme de siparişi mutfak ekranında, hesabı kasa ekranında anlık görür.",
      },
      {
        q: "Müşterinin uygulama indirmesi gerekiyor mu?",
        a: "Hayır. QR kod telefonun kamerasıyla okutulur ve menü doğrudan tarayıcıda açılır; üyelik de gerekmez.",
      },
      {
        q: "Ek donanım gerekiyor mu?",
        a: "Hayır. Kasa, garson ve mutfak ekranları tablet, telefon ya da bilgisayarın tarayıcısında açılır. Masalara yalnızca panelden yazdırdığınız QR kartları konur.",
      },
    ],
  },
  {
    id: "musteri",
    title: "Müşteriler için",
    items: [
      {
        q: "Hesabı nasıl bölüşürüz?",
        a: "Üç yol var: hesabı eşit bölmek, herkesin kendi yediği kalemleri seçmesi ya da istediği tutarı girmesi. Kalan tutar herkesin ekranında canlı güncellenir; aynı kalem iki kişi tarafından ödenemez.",
      },
      {
        q: "Ödeme nasıl yapılır?",
        a: "İşletme kartlı ödemeyi açtıysa payınızı iyzico'nun güvenli ödeme sayfasından kartla ödersiniz. Kartlı ödeme kapalıysa hesabı ve payınızı ekranda görür, ödemeyi garsona nakit ya da POS cihazıyla yaparsınız.",
      },
      {
        q: "Kart bilgilerim güvende mi?",
        a: "Kart bilgileri iyzico'nun ödeme formuna girilir; Üleş'in ya da işletmenin sunucusuna hiç gelmez. Fişte kartınızın yalnızca son 4 hanesi görünür.",
      },
      {
        q: "Fişimi nasıl alırım?",
        a: "Hesap kapandığında ekrandaki fişi görüntüleyebilir, yazdırabilir ya da e-postanıza gönderebilirsiniz. Bu fiş bir bilgi fişidir; mali fiş veya fatura işletme tarafından kesilir.",
      },
      {
        q: "Yaptığım ödemeyi iptal edebilir miyim?",
        a: "Ödeme işletmeye yapılır; iptal ve iade talepleri işletme tarafından değerlendirilir. Masadaki personele ya da işletmeye başvurun. Ayrıntılar İade ve İptal Politikası sayfasında.",
      },
      {
        q: "Bir sorun yaşarsam ne yapmalıyım?",
        a: "Sipariş ve hesapla ilgili konularda önce masadaki personele haber verin. Ödeme ya da sistemle ilgili bir sorun olursa destek adresimize yazın; hangi işletme ve masa olduğunu belirtirseniz daha hızlı yardımcı oluruz.",
      },
    ],
  },
  {
    id: "isletme",
    title: "İşletmeler için",
    items: [
      {
        q: "Kartlı ödemeyi hemen açmak zorunda mıyım?",
        a: "Hayır. Pek çok işletme QR'ı önce menü ve hesap görüntüleme için kullanır; müşteri payını görür, ödemeyi personele yapar. Kartlı ödemeyi hazır olduğunuzda ayarlardan açarsınız.",
      },
      {
        q: "Para kimin hesabına yatıyor?",
        a: "Doğrudan sizin. Kartlı tahsilat iyzico'nun lisanslı altyapısıyla işletmenin kendi hesabına yapılır; Üleş bir ödeme kuruluşu değildir ve para Üleş'ten geçmez.",
      },
      {
        q: "Garsonlar sistemi kullanabilecek mi?",
        a: "Evet. Garson ekranında kategori ve arama ile ürün tek dokunuşla eklenir; nakit ve POS ödemeleri de aynı hesaba işlenir. Müşteri siparişi ve garson siparişi aynı hesapta birleşir.",
      },
      {
        q: "Mevcut POS / kasa sistemimle çalışır mı?",
        a: "Ödeme ve hesap kapanma olayları kasa sisteminize bildirim (webhook) olarak gönderilebilir. POS cihazından alınan kartlı ödemeleri de sisteme kaydedebilirsiniz.",
      },
      {
        q: "Kurulum ne kadar sürer?",
        a: "Menünüzü ve masalarınızı birlikte giriyoruz, QR kodlarınız hazır çıkıyor. Kurulum ve personel eğitimi bizden. Ürünlerinizi Excel'den tek seferde de yükleyebilirsiniz.",
      },
      {
        q: "Ücreti ne kadar?",
        a: "Ücretsiz deneme süresiyle başlıyorsunuz. Aylık ücret işletmenin büyüklüğüne ve şube sayısına göre belirlenir; başvurunuzdan sonra size net teklif iletiyoruz.",
      },
      {
        q: "Üleş'e işletme olarak nasıl katılabilirim?",
        a: "İşletme başvuru formunu doldurun ya da ana sayfadan demo isteyin. Sizi arayıp ihtiyaçlarınızı dinliyor, menünüzü ve masalarınızı birlikte kuruyoruz.",
      },
    ],
  },
];

export const allFaqs: FaqItem[] = faqGroups.flatMap((g) => g.items);

/** Ana sayfada gösterilen kısa liste (sıra önemli). */
export const homeFaqs: FaqItem[] = [
  "Müşterinin uygulama indirmesi gerekiyor mu?",
  "Kartlı ödemeyi hemen açmak zorunda mıyım?",
  "Para kimin hesabına yatıyor?",
  "Garsonlar sistemi kullanabilecek mi?",
  "Mevcut POS / kasa sistemimle çalışır mı?",
  "Kurulum ne kadar sürer?",
].map((q) => allFaqs.find((f) => f.q === q)!);
