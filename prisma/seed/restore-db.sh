#!/bin/bash
# Restore the OKR database from the committed SQL dump.
# Run this once on a fresh server after cloning the repo.
#
# Usage:
#   chmod +x prisma/seed/restore-db.sh
#   ./prisma/seed/restore-db.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DB_PATH="$ROOT_DIR/dev.db"
SQL_PATH="$SCRIPT_DIR/data.sql"

if [ -f "$DB_PATH" ]; then
  echo "⚠️  dev.db already exists at $DB_PATH"
  read -p "Overwrite? (y/N) " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
  rm "$DB_PATH"
fi

echo "Restoring database from $SQL_PATH ..."
sqlite3 "$DB_PATH" < "$SQL_PATH"
echo "✅ Done — dev.db created with $(sqlite3 "$DB_PATH" 'SELECT COUNT(*) FROM OkrItem') items."
