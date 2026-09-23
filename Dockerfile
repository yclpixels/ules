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

# Ürün görsellerinin yazıldığı klasör. ÜRETİMDE BUNU VOLUME OLARAK BAĞLAYIN —
# aksi halde container her yenilendiğinde yüklenen görseller kaybolur:
#   docker run -v masaqr-uploads:/app/uploads ...
ENV UPLOAD_DIR=/app/uploads
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads
VOLUME ["/app/uploads"]

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
