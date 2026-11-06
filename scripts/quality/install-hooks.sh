#!/bin/sh
# `prepare` hook: install the git hooks declared in lefthook.yml.
# Skipped in CI and outside a git checkout (Docker build context), where there is nothing to hook.
# POSIX sh on purpose: the app Docker image (Alpine) has no bash, and runs this through `pnpm install`.
# Never fails the install: a missing hook is reported, not fatal.
set -eu
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

# A core.hooksPath pointing to a directory that no longer exists (a clone copied from another
# machine, a removed hook manager) silently disables every git hook. In this repo's own config it
# can only be stale: drop it so nobody has to. Set globally, it is the developer's choice — say so.
local_hooks_path="$(git config --local --get core.hooksPath || true)"
if [ -n "$local_hooks_path" ] && [ ! -d "$local_hooks_path" ]; then
	git config --local --unset core.hooksPath
	echo "lefthook: removed this repo's core.hooksPath, which pointed to a missing directory ($local_hooks_path)." >&2
fi
hooks_path="$(git config --get core.hooksPath || true)"
if [ -n "$hooks_path" ] && [ ! -d "$hooks_path" ]; then
	echo "lefthook: your global core.hooksPath points to a missing directory ($hooks_path): git hooks are off." >&2
	echo "lefthook: run \`git config --global --unset core.hooksPath\` then \`pnpm install\` to enable them." >&2
	exit 0
fi
pnpm exec lefthook install || echo "lefthook: could not install the git hooks — run \`pnpm exec lefthook install\` and fix what it reports." >&2
