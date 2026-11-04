#!/usr/bin/env bash
# Parity proof: the old Claude Code hook `.claude/hooks/block-bad-patterns.sh` (read from git
# history) and `scripts/quality/check-patterns.sh` must give the same verdict on the same input.
#
# Corpus: every ADDED line of every .ts/.tsx/.js/.jsx/.scss file in the last <n> commits of
# <ref>, one input per (commit, file) — the exact text the old hook would have seen on an edit —
# plus the self-test fixtures of check-patterns.sh (one per rule, and its exclusions).
#
#   bash scripts/ai/migration-parity.sh [<ref>=origin/alpha] [<n>=300]
#
# Exit 0 when every input gets the same verdict from both, 1 otherwise (each mismatch listed).

set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 2

REF="${1:-origin/alpha}"
N="${2:-300}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

git show "$REF:.claude/hooks/block-bad-patterns.sh" >"$WORK/old-hook.sh" 2>/dev/null || {
	echo "old hook not found at $REF:.claude/hooks/block-bad-patterns.sh" >&2
	exit 2
}

ROOT="$(pwd)"
old_verdict() { # <repo-relative path> <content-file> → block|pass
	local payload
	payload=$(jq -n --arg p "$ROOT/$1" --rawfile c "$2" '{tool_name:"Edit",tool_input:{file_path:$p,new_string:$c}}')
	if printf '%s' "$payload" | CLAUDE_PROJECT_DIR="$ROOT" bash "$WORK/old-hook.sh" >/dev/null 2>&1; then echo pass; else echo block; fi
}
new_verdict() { # <repo-relative path> <content-file>
	if bash scripts/quality/check-patterns.sh --verdict "$1" M "$2" >/dev/null 2>&1; then echo pass; else echo block; fi
}

inputs=0 blocked=0 mismatches=0
compare() { # <path> <content-file> <label>
	local o n
	o=$(old_verdict "$1" "$2")
	n=$(new_verdict "$1" "$2")
	inputs=$((inputs + 1))
	[ "$o" = block ] && blocked=$((blocked + 1))
	if [ "$o" != "$n" ]; then
		mismatches=$((mismatches + 1))
		printf 'MISMATCH %s — old=%s new=%s (%s)\n' "$1" "$o" "$n" "$3"
	fi
}

while read -r sha; do
	while read -r path; do
		[[ "$path" =~ \.(ts|tsx|js|jsx|scss)$ ]] || continue
		git show --format= -U0 "$sha" -- "$path" | sed -n 's/^+//p' | grep -v '^++ ' >"$WORK/content" || true
		[ -s "$WORK/content" ] || continue
		compare "$path" "$WORK/content" "$sha"
	done < <(git show --format= --name-only --diff-filter=AM "$sha")
done < <(git rev-list --no-merges -n "$N" "$REF")

# Synthetic corpus: the self-test fixtures of check-patterns.sh (one per rule, plus exclusions),
# judged by BOTH implementations. `A` fixtures exercise the Write-only src/app rule, so they are
# sent to the old hook as a Write.
fixtures=0
fixture() { # <expected> <path> <status> <content>
	printf '%s' "$4" >"$WORK/fixture"
	local o n
	if [ "$3" = A ]; then
		payload=$(jq -n --arg p "$ROOT/$2" --rawfile c "$WORK/fixture" '{tool_name:"Write",tool_input:{file_path:$p,content:$c}}')
		if printf '%s' "$payload" | CLAUDE_PROJECT_DIR="$ROOT" bash "$WORK/old-hook.sh" >/dev/null 2>&1; then o=pass; else o=block; fi
	else
		o=$(old_verdict "$2" "$WORK/fixture")
	fi
	if bash scripts/quality/check-patterns.sh --verdict "$2" "$3" "$WORK/fixture" >/dev/null 2>&1; then n=pass; else n=block; fi
	fixtures=$((fixtures + 1))
	if [ "$o" != "$n" ] || [ "$n" != "$1" ]; then
		mismatches=$((mismatches + 1))
		printf 'MISMATCH fixture %s — expected=%s old=%s new=%s: %s\n' "$2" "$1" "$o" "$n" "$4"
	fi
}
m='packages/app/src/modules/demo/Demo.tsx'
t='packages/app/src/modules/demo/demo.ts'
while IFS= read -r line; do
	eval "fixture ${line#*expect }"
done < <(grep -E '^[[:space:]]*expect (block|pass) ' scripts/quality/check-patterns.sh)

echo "parity: $fixtures rule fixtures"
echo "parity: $inputs inputs (commit × file) from the last $N commits of $REF — old hook blocked $blocked — $mismatches mismatch(es)"
[ "$mismatches" -eq 0 ]
