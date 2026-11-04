#!/usr/bin/env bash
# `prepare` hook: install the git hooks declared in lefthook.yml.
# Skipped in CI and outside a git checkout (Docker build context), where there is nothing to hook.
set -euo pipefail
[ -n "${CI:-}" ] && exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Codex reads hooks from the user's home only, so the repo cannot wire its ultra11y gate the way
# .claude/settings.json and opencode.json do. Say so once, with the command, instead of writing
# into ~/.codex behind the developer's back.
engine=packages/app/node_modules/.bin/ultra11y
if command -v codex >/dev/null 2>&1 && [ -x "$engine" ]; then
	codex_wired=$("$engine" status --json 2>/dev/null |
		node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const t=JSON.parse(s).targets.find(t=>t.target==="codex");console.log(t?String(t.wired):"")}catch{console.log("")}})' || true)
	if [ "$codex_wired" = "false" ]; then
		echo "ultra11y: Codex is installed but its accessibility gate is not — run once: pnpm --filter app exec ultra11y install --codex" >&2
	fi
fi

hooks_path="$(git config --get core.hooksPath || true)"
if [ -n "$hooks_path" ] && [ ! -d "$hooks_path" ]; then
	echo "lefthook: core.hooksPath points to a missing directory ($hooks_path)." >&2
	echo "lefthook: run \`git config --unset core.hooksPath\` then \`pnpm install\` to enable the git hooks." >&2
	exit 0
fi
exec lefthook install
