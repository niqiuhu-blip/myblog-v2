#!/bin/bash

BACKUP_DIR="/data/backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
echo "Backing up database..."
docker exec -t myblog-postgres pg_dumpall -c -U "${POSTGRES_USER:-myblog}" > "$BACKUP_DIR/db_$DATE.sql"

# Backup media directory (incremental)
echo "Backing up media files..."
tar -czf "$BACKUP_DIR/media_$DATE.tar.gz" -C /data media

# Delete old backups
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "db_*.sql" -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name "media_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
