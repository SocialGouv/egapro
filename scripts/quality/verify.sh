#!/usr/bin/env bash
# `pnpm verify` — the one command that says whether a change is ready.
#
# Runs every mechanical gate the CI runs on a PR, locally, and keeps going after a failure so
# the summary lists ALL of them at once. Same verdict for a human, Claude Code, OpenCode or any
# other agent: a task is not done while this exits non-zero.
#
#   VERIFY_BASE   ref the diff is taken against (default: origin/alpha)
#   VERIFY_SKIP   space-separated step names to skip, e.g. "test typecheck" (never in CI)
#   --force       re-run even if this exact code state already passed
#
# Steps: patterns · agent-config · agent-policy · a11y · lint · format · typecheck · test
#
# A full green run (no step skipped) records a fingerprint of the exact code state — HEAD, the
# merge-base, the working-tree diff and every untracked file. Re-running on the same state (the
# `/implement` → `/review gates` hand-off) answers at once instead of replaying the whole suite;
# any change to the code, even one byte, invalidates it.

set -uo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT" || exit 2

BASE="${VERIFY_BASE:-origin/alpha}"
SKIP=" ${VERIFY_SKIP:-} "
FAILED=()
PASSED=()

STAMP="$(git rev-parse --git-path verify-green)"
fingerprint() {
	{
		git rev-parse HEAD
		git merge-base "$BASE" HEAD 2>/dev/null || echo "no-merge-base"
		git diff HEAD --binary
		git ls-files --others --exclude-standard -z | xargs -0 shasum 2>/dev/null
	} | shasum | cut -d' ' -f1
}
FINGERPRINT="$(fingerprint)"
if [[ "${1:-}" != "--force" && -z "${VERIFY_SKIP:-}" && -f "$STAMP" && "$(cat "$STAMP")" == "$FINGERPRINT" ]]; then
	echo "verify: all gates already green for this exact code state (base $BASE) — nothing changed since. \`pnpm verify --force\` to re-run."
	exit 0
fi
rm -f "$STAMP"

step() {
	local name="$1"
	shift
	if [[ "$SKIP" == *" $name "* ]]; then
		printf '\n── %s (skipped)\n' "$name"
		return
	fi
	printf '\n── %s: %s\n' "$name" "$*"
	if "$@"; then
		PASSED+=("$name")
	else
		FAILED+=("$name")
	fi
}

a11y_static() {
	(cd packages/app && pnpm exec ultra11y audit src --jsx --graph --standard rgaa --lang fr --fail-on blocking)
}

step patterns bash scripts/quality/check-patterns.sh --diff "$BASE"
step agent-config node scripts/ai/sync-agent-config.mjs --check
step agent-policy node --test scripts/ai/sync-agent-config.test.mjs
step a11y a11y_static
step lint pnpm lint:check
step format pnpm format:check
step typecheck pnpm typecheck
step test pnpm test

printf '\n══ verify (base %s)\n' "$BASE"
[ ${#PASSED[@]} -gt 0 ] && printf '  PASS  %s\n' "${PASSED[@]}"
if [ ${#FAILED[@]} -gt 0 ]; then
	printf '  FAIL  %s\n' "${FAILED[@]}"
	echo "Fix the cause, then re-run \`pnpm verify\`. Do not weaken a test, a rule or a threshold to get green."
	exit 1
fi
# Stamp only a full run whose code did not move while it ran (a step or an editor may write files).
[ -z "${VERIFY_SKIP:-}" ] && [ "$(fingerprint)" == "$FINGERPRINT" ] && echo "$FINGERPRINT" >"$STAMP"
echo "All gates green."
