#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$ROOT_DIR/backups"
ARCHIVE="$BACKUP_DIR/mrz-trading-journal-$STAMP.tar.gz"

mkdir -p "$BACKUP_DIR"
tar -czf "$ARCHIVE" \
  --exclude='./node_modules' \
  --exclude='./dist' \
  --exclude='./backups' \
  --exclude='./.git' \
  --exclude='./.env' \
  --exclude='./.impeccable' \
  --exclude='./work' \
  --exclude='./outputs' \
  -C "$ROOT_DIR" .

shasum -a 256 "$ARCHIVE" > "$ARCHIVE.sha256"
printf 'Created %s\nChecksum %s.sha256\n' "$ARCHIVE" "$ARCHIVE.sha256"
