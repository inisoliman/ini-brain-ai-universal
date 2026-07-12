#!/usr/bin/env bash
set -euo pipefail

mkdir -p upstream-archives

archive_repo() {
  local id="$1"
  local url="$2"
  local tmp
  tmp="$(mktemp -d)"
  git clone --mirror "$url" "$tmp/$id.git"
  git -C "$tmp/$id.git" bundle create "$PWD/upstream-archives/$id.bundle" --all
}

archive_repo "codebase-memory-mcp" "https://github.com/DeusData/codebase-memory-mcp.git"
archive_repo "delegate-skills" "https://github.com/amElnagdy/delegate-skills.git"

ls -lh upstream-archives
