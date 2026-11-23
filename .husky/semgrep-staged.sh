#!/bin/sh
# Shift-left: incremental Semgrep scan over the staged .ts files (paths passed by lint-staged).
# Only blocks on ERROR findings; WARNINGs are shown but do not block (CI is the authoritative gate).
# If semgrep is not installed locally, skip with a notice instead of blocking the commit.
if ! command -v semgrep >/dev/null 2>&1; then
  echo "semgrep not found: skipping local security scan (CI enforces it). Install: pipx install semgrep" >&2
  exit 0
fi

# Never scan the rule fixtures: they contain intentional violations.
files=""
for f in "$@"; do
  case "$f" in
    *.semgrep/*) ;;
    *) files="$files $f" ;;
  esac
done
[ -z "$files" ] && exit 0

# shellcheck disable=SC2086
exec semgrep scan --config .semgrep/nestjs-security.yml --metrics=off --quiet --error --severity ERROR $files
