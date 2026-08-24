#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y-%m-%d_%H%M)
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

set -a
source "$APP_DIR/.env"
set +a

cd "$APP_DIR"
docker compose exec -T db pg_dump -U "${DB_USER:-postgres}" "${DB_NAME:-comunicazioni_servizi}" \
  | gzip > "$BACKUP_DIR/backup_${DATE}.sql.gz"

find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Backup completato: $BACKUP_DIR/backup_${DATE}.sql.gz"
