#!/bin/bash

BACKUP_DIR="$HOME/Documents/DELIGHT SCHOOL MANEGMENT/backups"
DB_NAME="delight_school_management"
DB_USER="delight_user"
DB_PASS="delight123"

mkdir -p "$BACKUP_DIR"

mysqldump --no-tablespaces -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/delight_backup_$(date +%Y-%m-%d_%H-%M-%S).sql"

echo "Database backup completed successfully."
echo "Saved in: $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | tail
