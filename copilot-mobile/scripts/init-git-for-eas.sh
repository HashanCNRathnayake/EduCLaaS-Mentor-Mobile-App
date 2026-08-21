#!/usr/bin/env bash
set -euo pipefail
# Run from the repo root or this script's folder. Initializes a git repo and makes an initial commit.
cd "$(dirname "$0")/.."
if [ -d .git ]; then
  echo "Git repo already exists in $(pwd)"
  exit 0
fi
if ! command -v git >/dev/null 2>&1; then
  echo "git not found. Install git and re-run this script." >&2
  exit 2
fi
git init
git add .
git commit -m "chore: prepare for EAS build (init repo for packaging)" || true
echo "Git initialized and initial commit created. Now run: npx eas-cli build -p android --profile preview --clear-cache"
