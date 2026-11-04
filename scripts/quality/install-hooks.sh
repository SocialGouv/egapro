#!/usr/bin/env bash
# `prepare` hook: install the git hooks declared in lefthook.yml.
# Skipped in CI and outside a git checkout (Docker build context), where there is nothing to hook.
set -euo pipefail
[ -n "${CI:-}" ] && exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
hooks_path="$(git config --get core.hooksPath || true)"
if [ -n "$hooks_path" ] && [ ! -d "$hooks_path" ]; then
	echo "lefthook: core.hooksPath points to a missing directory ($hooks_path)." >&2
	echo "lefthook: run \`git config --unset core.hooksPath\` then \`pnpm install\` to enable the git hooks." >&2
	exit 0
fi
exec lefthook install
