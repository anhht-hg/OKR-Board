#!/bin/sh
# docker-entrypoint.sh
#
# Bootstraps the SQLite database from the committed SQL dump the FIRST time
# the container starts (i.e. when the volume is empty). On all subsequent
# deploys the volume already has the live database, so this is a no-op and
# stakeholder data is preserved.

set -e

DB_PATH="${DB_PATH:-/app/data/dev.db}"
SQL_DUMP="/app/prisma/seed/data.sql"

# Create the data directory if it doesn't exist (first run)
mkdir -p "$(dirname "$DB_PATH")"

if [ ! -f "$DB_PATH" ]; then
  echo "No database found at $DB_PATH — initializing from seed dump..."
  sqlite3 "$DB_PATH" < "$SQL_DUMP"
  echo "Database initialized with $(sqlite3 "$DB_PATH" 'SELECT COUNT(*) FROM OkrItem') items."
else
  echo "Database exists at $DB_PATH ($(sqlite3 "$DB_PATH" 'SELECT COUNT(*) FROM OkrItem') items) — skipping init."
fi

exec "$@"
