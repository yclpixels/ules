# Masa QR Ödeme

Restoran/kafe masalarına yerleştirilecek QR kodlar üzerinden menüden sipariş verme, hesabı
görüntüleme, eşit bölme veya istenen tutarı ödeme sistemi. Çoklu şube destekli.

## Teknoloji

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite (yerel geliştirme; üretimde Postgres'e geçilebilir)
- `qrcode` ile masa QR kodu üretimi
- `jose` ile admin oturum yönetimi (JWT + httpOnly cookie), Node `crypto.scrypt` ile şifre hash'leme
- `iyzipay` ile gerçek ödeme entegrasyonu (opsiyonel, bkz. aşağı)
- `nodemailer` ile fiş e-postası (opsiyonel, bkz. aşağı)

## Kurulum

```bash
npm install
npx prisma migrate dev
npm run db:seed   # ilk şube + müdür hesabı + örnek kategori/ürün/masa verisi
npm run dev
```

Uygulama http://localhost:3000 adresinde açılır, `/admin` yönlendirir.

İlk şube ve müdür hesabı `npm run db:seed` ile otomatik oluşturulur — konsolda kullanıcı
adı/şifre yazdırılır (varsayılan şube: `Ana Şube`, kullanıcı: `yonetici` / `degistir123`,
**giriş yaptıktan sonra şifreyi değiştirin**). Farklı isim/şifre istersen seed'den önce
`.env`'e `SEED_BRANCH_NAME` / `SEED_MANAGER_USERNAME` / `SEED_MANAGER_PASSWORD` ekle.

**İkinci bir şube açmak** için aynı komutu farklı değerlerle tekrar çalıştır:

```bash
SEED_BRANCH_NAME="Kadıköy Şubesi" SEED_MANAGER_USERNAME="kadikoy_mudur" SEED_MANAGER_PASSWORD="..." npm run db:seed
```

Her şubenin masaları, ürünleri, kategorileri ve personeli tamamen izole — bir şubenin müdürü
diğer şubenin verisini göremez/değiştiremez (URL'yi doğrudan yazarak da bypass edilemez, test
edildi).

## Sayfalar

- `/admin/login` — Personel girişi (kullanıcı adı + şifre)
- `/admin` — Kasa: kendi şubesindeki masaların açık hesap / ödenen / kalan durumu (her iki rol)
- `/admin/siparisler` — Günlük sipariş/ciro raporu, tarih seçilebilir (**sadece müdür**)
- `/admin/masalar` — Masa ekleme, her masa için QR kod ve link (**sadece müdür**)
- `/admin/masalar/[tableId]` — Sipariş girme/çıkarma ve **nakit ödeme alma** (her iki rol de)
- `/admin/urunler` — Kategori ve ürün yönetimi (**sadece müdür**)
- `/admin/personel` — Personel ekleme/pasifleştirme/şifre sıfırlama, rol atama (**sadece müdür**)
- `/admin/hesabim` — Kendi şifreni değiştirme (her iki rol de)
- `/admin/degerlendirmeler` — Müşteri puanları (yemek/servis/ortam/fiyat, 30 günlük ortalama, düşük puanlar kırmızı) (**sadece müdür**)
- `/admin/isletmeler` — Tüm işletmeler ve abonelik durumları (**sadece OWNER**)
- `/admin/kayitlar` — Erişim ve işlem kayıtları (KVKK) (**sadece müdür**)
- `/admin/ayarlar` — Google yorum linki, bahşiş yüzdeleri ve KVKK işletme bilgileri (**sadece müdür**)
- `/admin/gun-sonu` — Z raporu: sistemdeki nakit / POS kart / QR kart / bahşiş; sayılan nakit girilir,
  eksik-fazla hesaplanır ve kayıt altına alınır (`DayClose`) (**sadece müdür**)
- `/admin/performans` — Personel bazlı: eklediği kalem, satış, aldığı ödeme, bahşiş, sildiği kalem;
  tarih aralığı seçilebilir (**sadece müdür**)
- `/masa/[qrToken]` — Müşteri ekranı (QR ile açılır): **Menü** sekmesinden kendi siparişini
  verebilir, **Hesap** sekmesinden güncel hesabı görüp eşit böl / tutar gir ile öder
- `/fis/[orderId]` — Herkese açık, yazdırılabilir fiş sayfası + e-posta ile gönderme
- `/menu/[slug]` — Herkese açık, paylaşılabilir/gömülebilir menü (arama motorlarına açık)
- `/gizlilik` — KVKK aydınlatma metni şablonu (fiş e-postasında bağlantısı var)

## Kapsam

- **Çoklu şube**: her `Table`/`Category`/`Product`/`StaffUser` bir `Branch`'e bağlı; tüm admin
  sorguları oturumdaki `branchId` ile filtreleniyor (bkz. `src/lib/session.ts`, her admin
  sayfası/action). Müşteri tarafı (QR) şubeden bağımsız çalışır — masa hangi şubeye aitse o
  şubenin menüsünü gösterir.
- Sipariş hem personel (garson ekranı) hem de müşterinin kendisi (masadaki QR → Menü sekmesi)
  tarafından girilebilir — aynı açık hesaba (Order) eklenir.
- İki rol var: **Müdür** (tüm yetkiler) ve **Garson** (sadece Kasa + sipariş girme/nakit ödeme
  alma). Yetki kontrolü hem gezinme menüsünde hem de her sayfa/server action'da sunucu
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

## Gerçek yayına alma (deployment) — hiçbir sağlayıcıya kilitlenmeden

Kod bilerek hiçbir hosting'e özel API/SDK kullanmıyor (Vercel'e özgü hiçbir şey yok) — bu
yüzden barındırmayı istediğiniz zaman değiştirebilirsiniz. Taşınabilirliği sağlayan üç şey:

- **Veritabanı standart Postgres.** Neon, Supabase, Railway, Vercel Postgres, kendi
  sunucunuz — hepsi aynı Postgres protokolünü konuşur. Birinden diğerine geçiş sadece
  `pg_dump` + `pg_restore` + `DATABASE_URL`'i değiştirmek.
- **`Dockerfile` ile her yerde çalışır.** Railway, Render, Fly.io, kendi VPS'iniz — Docker
  çalıştıran her platformda aynı image çalışır. Vercel'i seçerseniz Docker'a hiç gerek yok
  (Vercel kendi build sistemini kullanır), ama aynı kod tabanı ikisinde de çalışır.
- **Ödeme/e-posta zaten soyutlanmış.** `PAYMENT_PROVIDER` ve `SMTP_*` ile sağlayıcı
  değiştirmek kod değişikliği gerektirmiyor (bkz. yukarı).

**NOT:** Bu geliştirme ortamında Docker kurulu değil, bu yüzden `docker build` komutunun
kendisi hiç çalıştırılamadı. Ama `npm run build` ile üretilen `output: "standalone"` klasörü
(Dockerfile'ın son aşamasının kopyaladığı tam olarak bu klasördür) `node server.js` ile
doğrudan çalıştırılıp test edildi: sunucu ayakta kalıyor, ve en riskli nokta olan iyzipay'in
dinamik olarak yüklediği dosyalar (`outputFileTracingIncludes` sayesinde) standalone build'e
doğru şekilde dahil oluyor — `apiKey cannot be empty` gibi beklenen bir hata alınıyor,
"modül bulunamadı" hatası yok. Test edilmeyen tek kısım Docker image'ının kendisinin build
edilmesi (Alpine Linux base image, `npm ci` adımı vb.) — ilk `docker build`'de yine de gözünüz
üstünde olsun.

### Adımlar

1. **Postgres'e geçiş — DİKKAT:** `prisma/migrations` klasörü SQLite için üretildi
   (`migration_lock.toml` = sqlite) ve SQL'i Postgres'te çalışmaz. Geçişte:
   `provider = "postgresql"` yap, `prisma/migrations` klasörünü sil, `DATABASE_URL`'i Postgres'e
   çevir, `npx prisma migrate dev --name init` ile sıfırdan tek migration üret, sonra `npm run db:seed`.
   Eski SQLite verisi taşınmaz (pilot verisi için sorun değil; gerekiyorsa export/import yazılır).
2. **Yerel Postgres ile deneyin (opsiyonel ama önerilir).** Docker kurulduysa:
   `docker compose up -d`, sonra `prisma/schema.prisma`'da `provider = "sqlite"` →
   `provider = "postgresql"`, `.env`'de `DATABASE_URL="postgresql://masaqr:masaqr@localhost:5432/masaqr"`,
   `npx prisma migrate dev`. Gerçek sağlayıcıya geçmeden önce şemanın sorunsuz çalıştığını
   kendi makinenizde görmüş olursunuz.
3. **Barındırma + veritabanı sağlayıcısı seçin ve hesap açın** (bunu ben yapamam — hesap
   oluşturma ve ödeme içeriyor). Hızlı başlangıç için Vercel (uygulama) + Neon (Postgres, her
   ikisi de kredi kartsız ücretsiz katmana sahip) öneririm; VPS + Docker de eşit derecede
   geçerli, sadece bakım yükü size kalır.
4. **Prod veritabanına migration'ı çalıştırın**: `DATABASE_URL=<gerçek bağlantı dizesi> npx prisma migrate deploy`
   (kendi makinenizden, tam proje koduyla — bkz. `Dockerfile`'daki not).
5. **Domain + SSL.** Vercel'de otomatik; VPS'te kendiniz kurarsınız (ör. Caddy/nginx + Let's Encrypt).
6. **Ortam değişkenlerini prod'a taşıyın**: yeni bir `SESSION_SECRET` (`openssl rand -base64 32`),
   `PAYMENT_PROVIDER=iyzico` + gerçek anahtarlar, `SMTP_*`, varsa `POS_WEBHOOK_URL`.
7. **`/gizlilik` sayfasını doldurun** — işletme unvanı/iletişim bilgisiyle, ideal olarak bir
   hukuk danışmanına kontrol ettirin.

## Sırada ne var

1. iyzico sandbox hesabı açıp ödeme entegrasyonunu gerçek bir ödeme ile doğrulamak
2. Gerçek SMTP bilgileriyle fiş e-postasını uçtan uca doğrulamak
3. Restoranın kullandığı POS sistemine özel entegrasyon kodunu `POS_WEBHOOK_URL`'in
   arkasında (ayrı bir servis olarak) yazmak
4. Resmi e-Arşiv/e-Fatura entegrasyonu (şu anki "fiş" sadece bilgilendirme amaçlı, yasal bir
   fatura değil)
5. Şube yönetimi için UI (şu an yeni şube açmak `npm run db:seed`'i farklı env değerleriyle
   çalıştırmayı gerektiriyor — bkz. yukarı)
6. Hız sınırlayıcı bellek içi (`src/lib/rateLimit.ts`); birden fazla sunucu instance'ına
   çıkınca Redis/Upstash ile değiştirilmeli
7. Müşteri kendi sipariş verirken not giremiyor (sadece garson ekranından not girilebiliyor)
8. Ürün görselleri artık yüklenebiliyor (yukarı bkz.), dosyalar sunucu diskinde tutuluyor.
   Birden fazla sunucuya çıkılırsa ortak bir depoya (S3/R2) taşınmalı — değişmesi gereken
   tek yer `src/lib/uploads.ts`.
