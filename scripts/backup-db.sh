#!/bin/bash
# Dump the live production database into prisma/seed/data.sql
# Run this before committing code changes if you want to snapshot current data.
#
# Usage (from project root):
#   ./scripts/backup-db.sh
#
# This updates prisma/seed/data.sql which IS committed.
# New deploys on fresh servers will use this snapshot to bootstrap.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT="$ROOT_DIR/prisma/seed/data.sql"

# Try volume-mounted path first, fall back to local dev.db
if docker volume inspect okr-board_okr_data &>/dev/null; then
  echo "Dumping from Docker volume..."
  docker run --rm \
    -v okr-board_okr_data:/data \
    alpine sh -c "apk add -q sqlite && sqlite3 /data/dev.db .dump" > "$OUT"
else
  DB="$ROOT_DIR/dev.db"
  if [ ! -f "$DB" ]; then
    echo "Error: no dev.db found at $DB"
    exit 1
  fi
  echo "Dumping from local dev.db..."
  sqlite3 "$DB" .dump > "$OUT"
fi

echo "✅ Saved to $OUT ($(wc -l < "$OUT") lines)"
echo "   Commit this file to update the bootstrap snapshot."
