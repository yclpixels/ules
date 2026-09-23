#!/usr/bin/env bash
# Günlük Postgres yedeği. KVKK m.12 "verilerin güvenli saklanması" ve
# restorana karşı veri kaybı sorumluluğu için asgari gereklilik.
#
# Kurulum (sunucuda):
#   chmod +x scripts/backup.sh
#   crontab -e  →  0 4 * * * /srv/masa-qr-odeme/scripts/backup.sh >> /var/log/masaqr-backup.log 2>&1
#
# ÖNEMLİ: yedek aynı sunucuda durursa disk/sunucu kaybında işe yaramaz.
# RESTIC_REPOSITORY ya da benzeri bir uzak hedef tanımlayın (S3/R2/başka sunucu).
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL tanımlı değil}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/masaqr}"
KEEP_DAYS="${KEEP_DAYS:-30}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/masaqr-$STAMP.sql.gz"

pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip -9 > "$OUT"

# Boş/bozuk yedek sessizce birikmesin: 1 KB altı dosyayı hata say.
if [ "$(stat -c%s "$OUT")" -lt 1024 ]; then
  echo "[backup] HATA: yedek şüpheli derecede küçük: $OUT" >&2
  exit 1
fi

echo "[backup] tamam: $OUT ($(du -h "$OUT" | cut -f1))"

# Uzak kopya (opsiyonel ama şiddetle önerilir)
if [ -n "${BACKUP_REMOTE:-}" ]; then
  rsync -a "$OUT" "$BACKUP_REMOTE/" && echo "[backup] uzak kopya gönderildi: $BACKUP_REMOTE"
fi

# Ürün görselleri veritabanında değil diskte duruyor; onlar da yedeklenmeli.
if [ -n "${UPLOAD_DIR:-}" ] && [ -d "$UPLOAD_DIR" ]; then
  IMG="$BACKUP_DIR/masaqr-uploads-$STAMP.tar.gz"
  tar -czf "$IMG" -C "$UPLOAD_DIR" .
  echo "[backup] görseller: $IMG"
  [ -n "${BACKUP_REMOTE:-}" ] && rsync -a "$IMG" "$BACKUP_REMOTE/"
fi

find "$BACKUP_DIR" -name 'masaqr-*.sql.gz' -mtime "+$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'masaqr-uploads-*.tar.gz' -mtime "+$KEEP_DAYS" -delete
echo "[backup] $KEEP_DAYS günden eski yedekler temizlendi"
