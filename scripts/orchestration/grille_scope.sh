#!/usr/bin/env bash
#
# grille_scope.sh — decides whether e2e-dev must replay the 185-coordinate
# recette grid (`pnpm --filter app test:e2e:grille`) on top of the E2E suite.
#
# Single source of the rule: .claude/agents/e2e-dev/AGENT.md and
# .claude/rules/e2e.md point here instead of restating the paths.
#
# Prints exactly one word on stdout:
#   play  — the diff touches the declaration démarche the grid replays
#   skip  — it does not; CI (`e2e.yaml`) still replays the grid on the PR
# The files that triggered `play` are listed on stderr, for the e2e-dev comment.
#
# Fail-safe: if the diff cannot be computed (unknown base ref, shallow clone),
# the answer is `play` — an unneeded grid run costs minutes, a skipped one can
# let a coordinate regression reach the PR.
#
# Usage:
#   bash scripts/orchestration/grille_scope.sh [<base-ref>]   # default origin/alpha
#   git diff --name-only … | bash scripts/orchestration/grille_scope.sh --stdin

set -euo pipefail

GRILLE_PATHS=(
    '^packages/app/src/modules/declaration/'
    '^packages/app/src/modules/declaration-remuneration/'
    '^packages/app/src/modules/cseOpinion/'
    '^packages/app/src/modules/navigation/'
    '^packages/app/src/modules/domain/'
    '^packages/app/src/server/rules/'
    '^packages/app/src/server/api/routers/(declaration[A-Za-z]*|cseOpinion|jointEvaluation)\.ts$'
    '^packages/app/src/app/declaration-remuneration/'
    '^packages/app/src/app/avis-cse/'
    '^packages/app/src/e2e/grille/'
    '^packages/app/src/e2e/helpers/'
    '^packages/app/playwright\.grille\.config\.ts$'
)

if [ "${1:-}" = "--stdin" ]; then
    CHANGED=$(cat)
else
    BASE="${1:-origin/alpha}"
    if ! CHANGED=$(git diff --name-only --end-of-options "${BASE}...HEAD" 2>/dev/null); then
        echo "grille_scope: cannot diff ${BASE}...HEAD — playing the grid (fail-safe)" >&2
        echo play
        exit 0
    fi
fi

PATTERN=$(IFS='|'; echo "${GRILLE_PATHS[*]}")
MATCHED=$(printf '%s\n' "$CHANGED" | grep -E "$PATTERN" || true)

if [ -n "$MATCHED" ]; then
    printf '%s\n' "$MATCHED" | sed 's/^/grille_scope: /' >&2
    echo play
else
    echo skip
fi
