#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.sql>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring database from $BACKUP_FILE..."
docker exec -i myblog-postgres psql -U "${POSTGRES_USER:-myblog}" -d "${POSTGRES_DB:-myblog}" < "$BACKUP_FILE"

echo "Restore completed"
