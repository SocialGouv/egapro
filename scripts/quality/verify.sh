#!/usr/bin/env bash
# `pnpm verify` — the one command that says whether a change is ready.
#
# Runs every mechanical gate the CI runs on a PR, locally, and keeps going after a failure so
# the summary lists ALL of them at once. Same verdict for a human, Claude Code, OpenCode or any
# other agent: a task is not done while this exits non-zero.
#
#   VERIFY_BASE   ref the diff is taken against (default: origin/alpha)
#   VERIFY_SKIP   space-separated step names to skip, e.g. "test typecheck" (never in CI)
#
# Steps: patterns · a11y · lint · format · typecheck · test

set -uo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT" || exit 2

BASE="${VERIFY_BASE:-origin/alpha}"
SKIP=" ${VERIFY_SKIP:-} "
FAILED=()
PASSED=()

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
echo "All gates green."
