#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  printf 'Usage: %s BACKUP.tar.gz [TARGET_DIR]\n' "$0" >&2
  exit 2
fi

ARCHIVE="$1"
TARGET_DIR="${2:-$(pwd)}"
if [[ ! -f "$ARCHIVE" ]]; then
  printf 'Backup not found: %s\n' "$ARCHIVE" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
tar -xzf "$ARCHIVE" -C "$TARGET_DIR"
printf 'Restored backup into %s\n' "$TARGET_DIR"
printf 'Create .env from .env.example, then run npm install, npm run migrate, and npm run build.\n'
