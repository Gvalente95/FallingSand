#!/usr/bin/env bash
set -euo pipefail

dir="${1:-}"
[ -z "${dir}" ] && { command -v zenity >/dev/null 2>&1 && dir="$(zenity --file-selection --directory || true)"; }
[ -z "${dir}" ] && { [ "$(uname)" = "Darwin" ] && dir="$(osascript -e 'tell app "System Events" to POSIX path of (choose folder)' || true)"; }
[ -z "${dir}" ] && { printf "Directory: "; IFS= read -r dir; }
[ -d "$dir" ] || { echo "Invalid directory" >&2; exit 1; }

ext="${EXT:-}"
out="${OUT:-}"

list() {
  if [ -n "$ext" ]; then
    find "$dir" -maxdepth 1 -type f -name "*.$ext" -print | while IFS= read -r p; do basename "$p"; done
  else
    find "$dir" -maxdepth 1 -type f -print | while IFS= read -r p; do basename "$p"; done
  fi
}

if [ -n "$out" ]; then list >"$out"; else list; fi
