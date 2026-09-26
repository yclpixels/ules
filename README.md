# Üleş — Masa QR Ödeme

Restoran ve kafeler için masadaki QR kodla menü, sipariş, hesap bölüşme ve ödeme sistemi.
Garson ekranı, mutfak ekranı, kasa, gün sonu ve raporlarla birlikte; çoklu şube destekli.
Canlı adres: **üleş.com** (`xn--le-wka21b.com`), Railway üzerinde, Cloudflare arkasında.

## Teknoloji

- Next.js 16 (App Router, `output: "standalone"`) + TypeScript + Tailwind 4
- Prisma 6 + **PostgreSQL** (yerelde de Postgres; SQLite kullanılmıyor)
- `jose` ile oturum (JWT + httpOnly çerez, `sessionVersion` ile iptal edilebilir),
  `crypto.scrypt` ile şifre özeti
- `iyzipay` ile kartlı ödeme (iyzico Checkout Form + Pazaryeri alt üye işyeri)
- E-posta: **Resend** HTTPS API (Railway Hobby planında giden SMTP kapalı), yedek olarak SMTP
- `qrcode` ile masa QR kodları (ekranda PNG, yazdırmada vektör SVG)
- Vitest (birim + gerçek Postgres entegrasyon testleri), GitHub Actions CI

## Yerel kurulum

Bir Postgres veritabanı gerekir (`docker compose up -d` ile ya da herhangi bir yerel Postgres).

```bash
npm install
cp .env.example .env        # DATABASE_URL ve SESSION_SECRET'ı doldurun
npx prisma migrate dev
npm run db:seed             # ilk şube + müdür + örnek menü ve masalar
npm run dev
```

Uygulama http://localhost:3000 adresinde açılır; personel girişi `/admin/login`.

**Seed ve şifre:** Veritabanı yerelse ve `SEED_MANAGER_PASSWORD` verilmezse müdür şifresi
`gelistirme123` olur. Yerel olmayan bir veritabanında (Railway vb.) `SEED_MANAGER_PASSWORD`
zorunludur (en az 8 karakter); şifre günlüğe yazılmaz. Var olan hesabın şifresine dokunulmaz.

**İkinci şube:** Panelden (`/admin/isletmeler` → "Yeni işletme aç", sahip hesabı gerekir) ya da:

```bash
SEED_BRANCH_NAME="Kadıköy Şubesi" SEED_MANAGER_USERNAME="kadikoy_mudur" SEED_MANAGER_PASSWORD="..." npm run db:seed
```

Menü adresi şube adından türetilir (`kadikoy-subesi`). Her şubenin masaları, ürünleri ve
personeli tamamen izoledir; bir şubenin müdürü diğerinin verisine erişemez.

**Sahip (OWNER) hesabı:** Seed yalnızca müdür açar. Bir hesabı platform sahibi yapmak için
(tüm işletmeleri ve demo/destek taleplerini görür):

```bash
npm run make-owner -- <kullanici_adi>
```

Komut `.env`'deki `DATABASE_URL`'e yazar. Panelde rol yükseltme ekranı bilerek yok; müdür
sahip hesabının şifresini sıfırlayamaz ya da onu pasifleştiremez.

## Roller ve sayfalar

Üç rol var: **Sahip** (platform, biz), **Müdür**, **Garson**. Sahip kendi şubesinde müdür
yetkisine sahiptir.

- `/admin` — **Kasa**: masa ızgarası; açık masada kalan tutar, açık kalma süresi, ürün sayısı,
  mutfakta bekleyen kalem (tüm roller)
- `/admin/masalar/[tableId]` — Garson ekranı: ürün kutucukları, adet/not, nakit/POS ödeme alma,
  "Tamamı" ile kalanı doldurma (tüm roller)
- `/admin/mutfak` — Mutfak/bar ekranı: masaya göre fişler, bekleme süresine göre renk, sesli
  uyarı, "tümü hazır", cihaz bazında kategori filtresi (tüm roller)
- `/admin/destek` — Bize destek talebi gönderme (tüm roller)
- `/admin/hesabim` — Kendi şifreni değiştirme (tüm roller)
- `/admin/masalar` — Masa ekleme, QR kodları, PNG indirme; `/admin/masalar/yazdir` — A4'e
  6 kart QR yazdırma (müdür)
- `/admin/siparisler` — Günlük sipariş ve tahsilat özeti (müdür)
- `/admin/gun-sonu` — Z raporu; açık masa varken uyarı (müdür)
- `/admin/urunler` — Kategori, ürün, görsel, çeviri (müdür)
- `/admin/personel` — Personel ekleme, şifre sıfırlama, pasifleştirme (müdür)
- `/admin/ayarlar` — Bahşiş, Google yorum linki, menü adresi, diller, KVKK bilgileri, kartlı
  ödeme ve iyzico alt üye işyeri (müdür)
- `/admin/performans`, `/admin/degerlendirmeler`, `/admin/kayitlar` — Raporlar (müdür)
- `/admin/isletmeler` — Tüm işletmeler, abonelikler, yeni işletme açma (sahip)
- `/admin/talepler` — Demo ve destek talepleri, deneme e-postası (sahip)
- `/masa/[qrToken]` — Müşteri ekranı (QR ile açılır): menü, sepet, hesap, bölüşme, ödeme
- `/menu/[slug]` — Herkese açık, gömülebilir menü (arama motorlarına açık)
- `/fis/[orderId]` — Yazdırılabilir fiş + e-postayla gönderme
- `/` — Tanıtım sitesi ve demo formu; `/gizlilik`, `/kullanim-sartlari`, `/on-bilgilendirme`,
  `/cerez-politikasi` — yasal metin şablonları

## Kapsam

- **Çoklu şube**: her `Table`/`Category`/`Product`/`StaffUser` bir `Branch`'e bağlı; tüm admin
  sorguları oturumdaki `branchId` ile filtreleniyor (bkz. `src/lib/session.ts`, her admin
  sayfası/action). Müşteri tarafı (QR) şubeden bağımsız çalışır — masa hangi şubeye aitse o
  şubenin menüsünü gösterir.
- Sipariş hem personel (garson ekranı) hem de müşterinin kendisi (masadaki QR → Menü sekmesi)
  tarafından girilebilir — aynı açık hesaba (Order) eklenir.
- Roller: **Sahip**, **Müdür** (şubede tüm yetkiler) ve **Garson** (Kasa, Mutfak, sipariş
  girme, nakit/POS ödeme alma). Yetki kontrolü hem gezinme menüsünde hem de her sayfa/server action'da sunucu
  tarafında yapılıyor (`verifyAdminSession` / `verifyManagerSession`, bkz. `src/lib/dal.ts`).
- **Kim yaptı kaydı**: sipariş kalemine kim eklediyse `OrderItem.addedBy`'a yazılır (müşteri
  kendi eklediyse boş kalır); silme işlemi gerçek silme değil "soft delete" (`removedAt` +
  `removedBy`) — hesaptan düşer ama Siparişler raporunda üstü çizili olarak görünür kalır.
  Nakit ödeme alan personelin adı `Payment.recordedBy`'da saklanır.
- **Bahşiş**: müşteri ödeme ekranında %5/10/15 (şube ayarından değişir) ya da serbest tutar seçer;
  `Payment.tipCents` ayrı tutulur, hesaptan düşmez, raporda ve fişte ayrı satır olarak görünür
  (ciroya karışmaz — vergi/dağıtım için ayrı kalem). Garson da nakit/POS ödemede bahşiş girebilir.
- **Ödeme sonrası akış** (sunday modeli): 4 kriterli yıldız puanı + yorum → ortalama 4+ ise
  Google yorum linkine yönlendirme (`/admin/ayarlar`'dan girilir). Düşük puanlar Google'a
  gitmez, `/admin/degerlendirmeler`'de kırmızı işaretli görünür. Sipariş başına en fazla 5 kayıt.
- Kalan hesaptan fazla girilen tutar reddedilmez, kabul edilir.
- **Hesap iptali ve ödeme iptali** (sadece müdür, `/admin/masalar/[tableId]`): müşteri ödemeden
  kalktıysa / ikram edildiyse hesap "İptal Et / Kapat" ile ödeme alınmadan kapatılır
  (`Order.status = CANCELLED`, raporda kırmızı "İptal" rozeti, ciroya girmez). Yanlış girilen
  nakit/POS ödemesi "İptal" ile geri alınır (`Payment.status = VOIDED`); hesap o ödemeyle
  kapanmışsa tekrar açılır. iyzico ödemeleri buradan iptal edilemez, iade iyzico panelinden yapılır.
- Masa başına aynı anda tek açık hesap veritabanı kısıtıyla garanti edilir (`Order.openTableKey`
  unique) — garson ve müşteri aynı anda ilk ürünü eklese bile iki ayrı hesap oluşmaz.
- Pasifleştirilen personel oturumu anında düşer: her admin isteğinde JWT'ye ek olarak
  veritabanındaki `isActive` kontrol edilir (`src/lib/dal.ts`).
- Fiş HTML'i (e-posta) müşteri/personel girdilerini kaçışlar (XSS koruması, `src/lib/receipt.ts`).
- **Ürün/kategori/masa düzenlenebilir ve silinebilir** (`/admin/urunler`, `/admin/masalar`).
  Sipariş geçmişinde kullanılmış bir ürün/masa silinemez (veri bütünlüğü için) — bunun yerine
  ürünü "tükendi" işaretleyin. Kategori silinince ürünleri otomatik "kategorisiz" olur, silinmez.
  Masanın QR token'ı isim değişse bile sabit kalır (bastırılmış QR bozulmaz).
- **Şifre yönetimi**: herkes `/admin/hesabim`'den kendi şifresini değiştirebilir; müdür
  `/admin/personel`'den başka bir personelin şifresini sıfırlayabilir.
- **Düşük puan bildirimi** (`src/lib/feedbackAlerts.ts`): 4 kriterin ortalaması 3'ün altındaysa
  müdür panelinde kırmızı uyarı bandı çıkar ("müşteri hâlâ masada olabilir") ve
  `Branch.alertEmail` doluysa oraya e-posta gider. Amaç, kötü Google yorumu yazılmadan
  müdahale edebilmek. Müdür `/admin/degerlendirmeler`'den "Gördüm" deyince bant düşer
  (`Feedback.acknowledgedAt/By`). Garsona gösterilmez. Bildirim en iyi çaba — e-posta
  gönderilemese de müşteri akışı bozulmaz; SMTP yoksa demo modda konsola düşer.
- **Garson sipariş ekranı**: kategori filtresi + arama + ürüne dokunarak ekleme
  (`src/components/WaiterOrderPanel.tsx`). Önceden tüm ürünler tek bir `<select>` içindeydi
  ve 60-80 ürünlü menüde kullanılamıyordu. Arama Türkçe karakter duyarsız ("kofte" → "Köfte").
  Adet/not gerekiyorsa ürünün yanındaki "⋯" ile açılır — en sık yapılan iş (tek adet ekle)
  tek dokunuş kalsın diye varsayılan olarak gizli. Ekleme normal `<form>` + server action.
- **İşletme açma paneli** (`/admin/isletmeler` → "Yeni işletme aç", **sadece OWNER**):
  şube + ilk müdür hesabı tek transaction'da oluşturulur (müdürsüz yarım şube kalmasın).
  Örnek ürün/masa **oluşturulmaz** — seed bunu yapıyordu ve restoran tek tek siliyordu.
  Artık sunucuya SSH'lemeye gerek yok.
- **Müşteri sepeti**: ürüne dokunmak artık siparişi anında hesaba düşürmüyor. Müşteri
  sepetini toplar, adetleri değiştirir, **not yazar** (daha önce sadece garson not girebiliyordu),
  sonra "Siparişi Gönder" ile tek istekte yollar. `POST /api/masa/[qrToken]/items` hem eski
  tek kalem biçimini hem `{items:[...]}` sepet biçimini kabul eder; fiyat her zaman sunucuda
  üründen okunur.
- **Mutfak ekranı** (`/admin/mutfak`, garson ve müdüre açık): açık hesaplardaki hazırlanmamış
  kalemler, masa adı ve bekleme süresiyle. 5 saniyede bir yenilenir ve **yeni sipariş gelince
  sesli uyarı** verir — mutfağın ekrana bakmasını beklemez. Ses tarayıcı politikası gereği
  vardiya başında bir kez "Sesli uyarıyı aç" ile etkinleştirilir; ses dosyası yok, kısa ton
  Web Audio ile üretilir. "Hazır" ile kalem listeden düşer (`OrderItem.preparedAt/By`) —
  ödemeyle ilgisi yoktur.

- **Herkese açık menü sayfası** (`/menu/[slug]`): masaya bağlı olmayan, paylaşılabilir
  menü. Adres `/admin/ayarlar`'dan verilir (`Branch.menuSlug`, Türkçe karakterler ve
  boşluklar otomatik temizlenir: "Ana Şube" → `ana-sube`); boş bırakılırsa sayfa yayına
  girmez. Sitesi olan işletme ayarlardaki hazır `<iframe>` koduyla kendi sitesine gömer;
  **sitesi olmayan aynı linki Instagram biyografisinde / WhatsApp'ta paylaşır** — pratikte
  işletmenin web varlığı olur. Hesap/ödeme/sipariş burada yoktur, sadece menü.
  **Arama motorlarına açık tek sayfa burasıdır** (`robots: index`) — işletmenin menüsünün
  Google'da çıkması istenen şeydir; masa/admin/fiş sayfaları `noindex` kalır.
  `Branch.websiteUrl` verilirse işletmenin sitesi/Instagram'ı hem bu sayfada hem müşteri
  ekranında link olarak görünür.

- **Ürün görseli yükleme** (`src/lib/uploads.ts`, `src/components/ImagePicker.tsx`):
  restoran telefonuyla çektiği fotoğrafı doğrudan yükleyebilir — sitesi olmayan işletme de
  görsel ekleyebilir. Sitesi olan, kendi sitesindeki görselin adresini yapıştırmaya devam
  edebilir (tek alan, `Product.imageUrl`). Fotoğraf **tarayıcıda küçültülür** (en fazla
  1400px, JPEG) — sunucuda görüntü işleme kütüphanesi yok, müşterinin menüsü mobil veriyle
  açılabilir kalır. Sunucu tarafında: dosya türü **beyana değil içeriğe** bakılarak
  doğrulanır (magic byte), 3 MB sınırı, dosya adı istemciden alınmaz (path traversal yok),
  yükleme sadece müdür (`401`), servis `/api/uploads/[name]` üzerinden `nosniff` ve uzun
  önbellekle. Test edildi: sahte "png" reddedildi, `../../.env` denemeleri 404, oturumsuz
  yükleme 401.
  **Dosyalar diskte (`UPLOAD_DIR`, varsayılan `./uploads`) tutulur — Docker'da volume
  olarak bağlanmalı**, aksi halde container yenilenince görseller kaybolur (`Dockerfile`'da
  `VOLUME` tanımlı). `scripts/backup.sh` görselleri de yedekler.

- **Çok dilli menü** (`src/lib/locales.ts`): şube dilleri `/admin/ayarlar`'dan seçilir
  (`Branch.supportedLocales`, ör. "tr,en"). **İlk dil ana dildir** — ürün/kategori adları
  `Product`/`Category` üzerindeki temel alanlardır, çeviri tablosuna yazılmaz. Diğer diller
  `ProductTranslation` / `CategoryTranslation`'da tutulur ve `/admin/urunler` → "Çeviriler"
  bölümünden girilir; ad boş bırakılırsa çeviri silinir. **Çevirisi olmayan ürün ana dile
  düşer**, yani kısmi çeviride bile menü eksiksiz görünür. Müşteri ekranında birden fazla dil
  varsa dil seçici çıkar (`/api/masa/[qrToken]?lang=en`); desteklenmeyen dil ana dile düşer.
  **Dil otomatik seçilir**: müşterinin telefon dili (`navigator.language`) kullanılır, turist
  hiçbir şeye dokunmadan kendi dilinde görür. Elle seçim yapılırsa o cihaz için hatırlanır
  (`localStorage`, erişilemezse sessizce otomatik algılamaya düşer).
  Fiyatlar dilden bağımsızdır.

- **Kaleme göre bölme** (müşteri ekranı → Hesap → "Kalem Seç"): müşteri hesaptaki
  kalemlerden ne yediyse işaretler, sadece onları öder. Ödenen kalem masadaki diğer
  kişilere "başkası üstlendi" olarak kilitli görünür (`OrderItem.settledPaymentId`).
  **Tutar istemciden alınmaz** — sunucu seçilen kalemlerin kendi fiyatından hesaplar
  (`priceSelectedItems`), böylece istek değiştirilerek eksik ödeme yapılamaz; test edildi
  (1 kuruşluk istek gönderildi, ₺50 tahsil edildi). Kalemler ödeme oluşturulurken rezerve
  edilir, ödeme başarısız olur ya da müdür iptal ederse tekrar boşa çıkar. Kalan hesaptan
  fazlası alınmaz (masadan biri eşit bölmeyle ödemiş olabilir). Para hesabını etkilemez —
  kalan tutar her zaman toplam eksi ödenen'dir.
- **Koyu tema.** Tek tema, sistem tercihine göre değişmez (restoranın görünümü her müşteride
  aynı olmalı). Uygulama açık tema sınıflarıyla yazıldığı için her dosyaya `dark:` varyantı
  eklemek yerine Tailwind renk değişkenleri `globals.css`'te yeniden tanımlandı: gri skalası
  ters (50 = en koyu), `white` = kart yüzeyi, `black` = birincil buton. Yeni yazılan kod da
  otomatik uyar. Fiş yazdırmada `@media print` ile beyaz zemin/siyah yazıya döner.

- **Müşteri siparişi şube bazında açılır/kapanır** (`Branch.customerOrderingEnabled`,
  **varsayılan kapalı**, `/admin/ayarlar`). Kapalıyken QR sadece menü + hesap görüntüleme
  olarak çalışır; müşteri sipariş veremez, "Ekle" butonları görünmez, siparişi personel girer.
  Yeni kurulumlarda böyle başlatılması önerilir — işletme sisteme alıştıktan sonra açılır.
  `/api/masa/[qrToken]/items` arayüzden bağımsız 403 döner.
- **Abonelik takibi ve sahip paneli.** Üç rol var artık: `OWNER` (platform sahibi — biz),
  `MANAGER`, `WAITER`. `/admin/isletmeler` (**sadece OWNER**) tüm işletmeleri, abonelik
  durumlarını (`TRIAL`/`ACTIVE`/`SUSPENDED`), deneme bitiş tarihlerini ve aylık ücretleri
  tek ekranda gösterir. Müdür panelinde kalan gün uyarı bandı çıkar (`src/lib/subscription.ts`).
  **Tahsilat bilerek kodda değil** — fatura + EFT; otomatik kart çekme şirket ve ödeme
  altyapısı gerektirir, bu ölçekte gereksiz. **Deneme dolunca sistem kilitlenmez**: servis
  ortasında panelin kapanması işletmeyi kaybettirir, uyarı gösterilir ve `SUSPENDED`'a geçiş
  elle yapılır. `OWNER` yalnızca sahip panelinde şubeler arası görür; diğer tüm sayfalar
  eskisi gibi `branchId` ile filtrelenir.

- **QR ile kartlı ödeme şube bazında açılır/kapanır** (`Branch.cardPaymentEnabled`,
  **varsayılan kapalı**, `/admin/ayarlar`'dan değişir). Kapalıyken müşteri menüyü ve hesabı
  görür, kişi başı payını hesaplar; tahsilatı personel alır (nakit/POS) — sistem para akışına
  hiç girmez, bu yüzden 6493 sayılı Kanun kapsamında ödeme hizmeti sunulmuş olmaz. Pilot
  kurulumların varsayılan modu budur. Ödeme uç noktası (`/api/masa/[qrToken]/pay`) arayüzden
  bağımsız olarak 403 döner, yani doğrudan API'ye istek atılarak aşılamaz.
  Açmadan önce o şube adına gerçek bir üye işyeri (iyzico vb.) anlaşması yapılmış olmalı.

- **KVKK aydınlatma metni** (`/gizlilik`): metin artık şubeye özel — işletme unvanı,
  adres, e-posta ve telefon `/admin/ayarlar`'dan girilir, `Branch.legalName` vb. alanlarda
  saklanır. Bilgiler boşken sayfa "doldurulmamış şablon" uyarısı gösterir. Şube üç yoldan
  bulunur: `?masa=<qrToken>` (müşteri masadan), `?fis=<orderId>` (fiş sayfası/e-postası),
  `?sube=<branchId>` (panelden önizleme). Link müşteri ekranının altında, fiş sayfasında ve
  fiş e-postasında yer alır (KVKK m.10 — verinin toplandığı yerde aydınlatma).
- **Erişim ve işlem kaydı** (`/admin/kayitlar`, **sadece müdür**): KVKK m.12 veri güvenliği
  tedbiri. Giriş denemeleri (başarılı/başarısız, IP ile), hesap iptali, ödeme iptali, personel
  ekleme/pasifleştirme/şifre sıfırlama, şifre değişikliği, gün sonu, ayar değişikliği ve fiş
  e-postası gönderimi kaydedilir (`src/lib/audit.ts`, `AuditLog`). Kayıtlar sadece eklenir —
  uygulamada silme/güncelleme yolu yoktur. Fiş e-postasında adres maskelenerek loglanır.
  Rutin sipariş işlemleri burada değil, `OrderItem.addedBy/removedBy`'da tutulur.
- **Yedekleme**: `scripts/backup.sh` — günlük `pg_dump` + gzip, boş yedek kontrolü, eski
  yedek temizliği, opsiyonel uzak kopya (`BACKUP_REMOTE`). Cron ile kurulur; **yedeği aynı
  sunucuda bırakmayın**, disk kaybında işe yaramaz.

- **Otomatik tazeleme**: Kasa (`/admin`) ve masa detay ekranı 10 saniyede bir kendini
  yeniler (`src/components/AutoRefresh.tsx`) — müşteri QR'dan sipariş verdiğinde garsonun
  ekranı elle yenilemeden güncellenir. Bir input/select odaktayken ve sekme arka plandayken
  tazeleme atlanır, yazılan tutar/not uçmaz.
- **Geri alınamaz işlemlerde onay**: hesap iptali, ödeme iptali, kalem/ürün/kategori/masa
  silme ve personel pasifleştirme tarayıcı onayı ister (`src/components/ConfirmButton.tsx`).

- **Sipariş notu**: garson ürün eklerken "az pişmiş", "acısız" gibi bir not girebilir
  (`OrderItem.note`) — hem garson ekranında hem müşterinin hesap görünümünde gösterilir.
- **Fiş**: hesap kapandığında müşteri "Fişi Görüntüle" linkiyle yazdırılabilir bir fiş
  görebilir, isterse e-posta adresine gönderebilir. `SMTP_HOST` (`.env`) boşsa demo modda
  çalışır (gerçekten göndermez, konsola loglar) — gerçek gönderim için kendi SMTP bilgilerinizi
  girin (Gmail app password, SendGrid, Resend SMTP vb.). Demo modu test edildi; gerçek SMTP
  ile uçtan uca doğrulanmadı (kimlik bilgisi gerektiriyor).
- `/admin` altındaki tüm sayfalar oturum korumalı (JWT session, `src/proxy.ts` + her
  sayfada/aksiyonda `verifyAdminSession()`/`verifyManagerSession()` kontrolü).
- Ödeme sağlayıcısı `.env` → `PAYMENT_PROVIDER` ile seçilir:
  - `"mock"` (varsayılan): demo modu, gerçek tahsilat yapmaz, ödeme anında başarılı sayılır
  - `"iyzico"`: `src/lib/payments/iyzico.ts` — iyzico'nun **Checkout Form** (hosted ödeme formu)
    API'sini kullanır. Kart bilgisi hiçbir zaman bizim sunucumuza/istemcimize gelmez.
    - **DİKKAT: Bu entegrasyon gerçek iyzico sandbox anahtarları olmadan uçtan uca test
      edilemedi.** Sandbox hesabı (sandbox-merchant.iyzipay.com/auth/register) alındıktan
      sonra gerçek bir ödeme ile doğrulanmalı — özellikle `buyer`/`address` alanları (bkz.
      `iyzico.ts` içindeki `genericBuyer`) iyzico'nun kabul ettiği formatla uyuşup uyuşmadığı
      kontrol edilmeli.
    - Bağlantı akışı test edildi: geçersiz/boş API anahtarıyla denendiğinde sistem çökmeden
      düzgün bir hata mesajı gösteriyor, kod yolu çalışıyor — eksik olan sadece gerçek sandbox
      kimlik bilgileriyle doğrulama.
- Ödeme tamamlandığında veya hesap kapandığında `POS_WEBHOOK_URL` (`.env`) tanımlıysa oraya
  JSON POST edilir (`src/lib/posWebhook.ts`) — restoranın kullandığı POS/kasa sistemine
  entegrasyon buradan yapılabilir. Test edildi ve doğru payload ile çalışıyor.
- **Demo ve destek talepleri** (`src/lib/support.ts`): tanıtım sitesindeki form ve paneldeki
  Destek sayfası talebi önce `SupportRequest` tablosuna yazar, sonra `SUPPORT_EMAIL`'e
  gönderir. E-posta gitmese de talep `/admin/talepler`'de görünür. İletişim alanı yalnızca
  geçerli e-posta ya da telefon kabul eder (`src/lib/contact.ts`); telefon `+90 5xx …`
  biçimine getirilir. Gelen e-postada "Yanıtla" müşterinin adresine gider.
- **Mutfak, hesap kapansa da siparişi gösterir**: müşteri önce ödeyip sonra bekleyebilir;
  son 6 saatte kapanan hesapların hazırlanmamış kalemleri "Hesap ödendi" rozetiyle görünür.
- **Sürüm uyuşmazlığı koruması**: `deploymentId` = Railway commit kimliği. Sayfa eski sürümden
  açıkken yeni sürüm yayına girerse tarayıcı hata yerine sayfayı yeniler.

## Test ve CI

```bash
npm run typecheck    # next typegen + tsc
npm run lint
npm test             # birim testleri; entegrasyon testleri TEST_DATABASE_URL ister
TEST_DATABASE_URL="postgresql://…@localhost:5432/test" npm test
```

Entegrasyon testleri (ödeme yarışları, askıdaki ödemeler, değerlendirme kuralı) tabloları
siler; bu yüzden yalnızca **yerel** bir adrese karşı çalışır, uzak adres verilirse başlamayı
reddeder. GitHub Actions her push'ta tip kontrolü, lint, testler (Postgres servisiyle) ve
Docker ile aynı koşullarda derleme çalıştırır (`.github/workflows/ci.yml`).

## Canlı ortam (Railway)

Uygulama Railway'de `Dockerfile` ile derlenir; `master`'a push edilen her commit otomatik
yayına alınır. Veritabanı Railway Postgres; alan adı Cloudflare üzerinden.

**Yeni sürüm yayına alma sırası:** Migration varsa **önce** migration, sonra push. Tersi
olursa yeni kod eksik sütunu okur ve sayfalar hata verir.

```bash
npx prisma migrate deploy   # .env'deki DATABASE_URL (Railway) — yalnızca yeni migration varsa
git push origin master
```

**Railway değişkenleri** (tam liste ve açıklamalar `.env.example`'da):

| Değişken | Not |
|---|---|
| `DATABASE_URL`, `SESSION_SECRET` | zorunlu |
| `APP_URL`, `NEXT_PUBLIC_APP_URL` | `https://xn--le-wka21b.com`; ikincisi build'e gömülür (Dockerfile `ARG`) |
| `TRUSTED_PROXY_HOPS` | `2` (Cloudflare + Railway) — IP tespiti ve hız sınırı için |
| `RESEND_API_KEY`, `EMAIL_FROM`, `SUPPORT_EMAIL` | e-posta; alan adı Resend'de doğrulanmış olmalı |
| `FIELD_ENCRYPTION_KEY` | IBAN/TC şifrelemesi; **kaybolursa şifreli alanlar okunamaz** |
| `PAYMENT_PROVIDER`, `IYZICO_*` | kartlı ödeme; iyzico'da alt üye kaydı olmayan şubede kapalı kalır |

**Dikkat edilecekler:**

- Ürün görselleri `/app/uploads`'a yazılır. Railway'de bu yola bir **Volume** bağlı değilse
  her deploy'da silinir.
- `scripts/backup.sh` cron'lu bir sunucu içindir, Railway'de çalışmaz. Railway Postgres
  yedeklemesini açın ya da düzenli `pg_dump` alın.
- Hız sınırlayıcı bellek içidir (`src/lib/rateLimit.ts`); birden fazla instance'a çıkılırsa
  Redis/Upstash ile değiştirilmeli. Aynı şekilde yüklenen görseller ortak bir depoya (S3/R2)
  taşınmalı — değişmesi gereken tek yer `src/lib/uploads.ts`.

## Sırada ne var

1. iyzico sandbox ile uçtan uca kartlı ödeme ve alt üye işyeri kaydı testi (canlıda kartlı
   ödemeyi açmadan önce şart)
2. Müşteri ekranının (`/masa`, `/menu`) yeni tasarım diline geçirilmesi
3. Panelden iade (şu an iyzico ödemesinin iadesi iyzico panelinden yapılıyor)
4. e-Arşiv / e-Fatura entegrasyonu (şu anki fiş yasal belge değil)
5. Ön sipariş ve grup siparişi (önce tasarım)
6. `ules.com` alan adına geçiş
7. KVKK ve kullanım metinlerinin hukuk kontrolü
