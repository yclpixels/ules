# Bu image herhangi bir Docker destekleyen barındırmada çalışır (Railway,
# Render, Fly.io, kendi VPS'iniz, vb.) — tek bir sağlayıcıya kilitlenmez.
#
# NOT: Bu geliştirme ortamında Docker kurulu olmadığı için bu Dockerfile
# uçtan uca build edilip test edilemedi. İlk build'de sorun çıkarsa en
# olası neden `output: "standalone"` ile `iyzipay` paketinin dinamik
# require'ları arasındaki etkileşimdir (bkz. next.config.ts yorumu).

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
# `prisma generate` ve `next build` PrismaClient'ı örnekliyor ve
# prisma.config.ts DATABASE_URL'in var olmasını istiyor — gerçek bağlantı
# kurulmuyor (generate hiç bağlanmaz), bu yüzden sahte bir değer yeterli.
# Gerçek değer sadece RUNTIME'da (Railway/host'un verdiği env) kullanılır.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
# src/lib/session.ts SESSION_SECRET yoksa modül yüklenirken hata fırlatıyor
# (bilinçli — runtime'da unutulmasın diye). Build sırasında bu route'u
# statik analiz ederken tetikleniyor; gerçek imzalama anahtarı runtime'da
# Railway'in env'inden gelir, buradaki değer sadece build'i geçirmek için.
ENV SESSION_SECRET="build-time-placeholder-not-used-at-runtime"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Ürün görsellerinin yazıldığı klasör. ÜRETİMDE BUNU KALICI BİR VOLUME OLARAK
# BAĞLAYIN — aksi halde container her yenilendiğinde yüklenen görseller
# kaybolur. Docker VOLUME komutu burada KULLANILMIYOR çünkü Railway gibi
# bazı PaaS'lar bunu desteklemiyor (kendi Volume özelliklerini kullanmanızı
# istiyorlar); düz Docker'da: docker run -v masaqr-uploads:/app/uploads ...
# Railway'de: servis → Settings → Volumes → mount path "/app/uploads".
ENV UPLOAD_DIR=/app/uploads
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# NOT: Migration'lar burada ÇALIŞTIRILMAZ — standalone build sadece
# gerçekten import edilen dosyaları içerir, prisma CLI'ın kendisi bu image'a
# dahil değil. Yeni bir sürüm yayınlamadan önce migration'ı ayrı bir yerden
# çalıştırın: `DATABASE_URL=... npx prisma migrate deploy`
# (kendi makinenizden ya da CI adımında, tam proje koduyla).
CMD ["node", "server.js"]
