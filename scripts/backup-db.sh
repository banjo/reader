#!/usr/bin/env bash
# Create a compressed PostgreSQL backup and prune old local copies.
#
# Usage:
#   DATABASE_URL=postgresql://... ./scripts/backup-db.sh
#
# Optional:
#   BACKUP_DIR=/var/backups/banjo       local destination (default: ./backups)
#   RETENTION_DAYS=14                   delete local dumps older than this
#   BACKUP_S3_URI=s3://bucket/prefix    upload with the AWS CLI when available

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if ! command -v pg_dump >/dev/null 2>&1; then
    echo "pg_dump was not found. Install the PostgreSQL client tools first." >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$BACKUP_DIR/banjo-$timestamp.dump"
temporary="$file.tmp"

trap 'rm -f "$temporary"' EXIT

pg_dump --format=custom --no-owner --no-acl --file "$temporary" "$DATABASE_URL"
mv "$temporary" "$file"
trap - EXIT

find "$BACKUP_DIR" -type f -name 'banjo-*.dump' -mtime +"$RETENTION_DAYS" -delete

if [ -n "${BACKUP_S3_URI:-}" ]; then
    if command -v aws >/dev/null 2>&1; then
        aws s3 cp "$file" "${BACKUP_S3_URI%/}/"
    else
        echo "BACKUP_S3_URI is set but the AWS CLI is not installed; keeping the local copy only." >&2
    fi
fi

echo "Backup written to $file"
