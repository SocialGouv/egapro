#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
#
# Invokes the e2e-dev agent on an epic integration branch (epic/<N>) once every
# sub-ticket has been squash-merged into it. The agent runs the existing E2E
# Playwright suite (regression triage), then nests/creates an E2E scenario for
# the feature, and pushes the test commit onto epic/<N> so it ships in the same
# final PR as the code.
#
# Unlike run_doc_writer.sh (read-only, runs on the main worktree), e2e-dev needs
# a running dev server + disposable DB to execute `pnpm test:e2e`. This script
# therefore provisions a DEDICATED worktree on origin/epic/<N> (detached — the
# branch itself is held by the main worktree) with a full docker stack via
# setup-worktree.sh, spawns the agent there, then tears the stack + worktree
# down.
#
# Usage:
#   bash scripts/orchestration/run_e2e_dev.sh <epic_N>
#
# Exit codes:
#   0  agent returned `validated` (suite green, coverage handled, pushed)
#   1  technical failure (claude CLI missing, malformed JSON, agent `failed`)
#   2  agent returned `rate_limited` (transient, caller may retry later)
#   3  agent returned `regression` (a real E2E regression — surfaced on the epic;
#      NON-BLOCKING for the epic, the final PR is still opened for human review)
#
# Hard rule: NEVER fails the epic. Like doc-writer, any non-`validated` outcome
# just logs + surfaces and the caller (epic_loop.sh) proceeds to open the final
# PR. A `regression` is surfaced prominently (agent posts an `e2e-dev:` comment
# on the epic; this script logs E2E_REGRESSION) so the human sees it on the PR.
#
# Env (defaults shown):
#   EPIC_LOOP_BUDGET_E2E      15     USD max for the e2e-dev Opus run
#   E2E_DEV_TIMEOUT           3600   seconds max (60 min — dev server + full E2E suite)
#   E2E_WORKTREE_INDEX        <EPIC_MAX_PARALLEL or 5>   docker port index for the dedicated worktree
#   EPIC_MAX_PARALLEL         5      used only to derive the default E2E_WORKTREE_INDEX

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <epic_N>" >&2
    exit 1
fi

EPIC_N="$1"
if ! [[ "$EPIC_N" =~ ^[0-9]+$ ]]; then
    echo "ERROR: epic number must be a positive integer (got: $EPIC_N)" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AID="e2e-dev-${EPIC_N}"
BRANCH="epic/${EPIC_N}"

BUDGET="${EPIC_LOOP_BUDGET_E2E:-15}"
AGENT_TIMEOUT="${E2E_DEV_TIMEOUT:-3600}"
INDEX="${E2E_WORKTREE_INDEX:-${EPIC_MAX_PARALLEL:-5}}"
PORT=$((3001 + INDEX))
WT_PATH="${REPO_ROOT}/../egapro-epic${EPIC_N}-e2e"

# ---- Pre-flight: the integration branch must exist on origin ----
cd "$REPO_ROOT"
git fetch origin alpha "$BRANCH" --quiet 2>/dev/null || true
if ! git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    echo "ERROR: $BRANCH does not exist on origin — nothing to test" >&2
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "no_epic_branch=$BRANCH"
    exit 1
fi

bash "$SCRIPT_DIR/log_event.sh" "$AID" START "epic=$EPIC_N branch=$BRANCH index=$INDEX port=$PORT"

# ---- timeout binary detection (mirror epic_loop.sh) ----
TIMEOUT_BIN=""
if command -v timeout >/dev/null 2>&1; then
    TIMEOUT_BIN="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
    TIMEOUT_BIN="gtimeout"
fi
TIMEOUT_PREFIX=""
[ -n "$TIMEOUT_BIN" ] && TIMEOUT_PREFIX="$TIMEOUT_BIN $AGENT_TIMEOUT"

# ---- Provision a dedicated worktree (detached on origin/epic/<N>) + stack ----
# Detached because epic/<N> is held by the main worktree; the agent pushes back
# with `git push origin HEAD:epic/<N>`.
cleanup_worktree() {
    if [ -d "$WT_PATH" ]; then
        bash "$SCRIPT_DIR/log_event.sh" "$AID" TEARDOWN "wt=$WT_PATH"
        (cd "$WT_PATH" && bash "$REPO_ROOT/scripts/teardown-worktree.sh") >/dev/null 2>&1 || true
        (cd "$REPO_ROOT" && git worktree remove --force "$WT_PATH") >/dev/null 2>&1 || true
    fi
}
trap cleanup_worktree EXIT

if [ ! -d "$WT_PATH" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" WORKTREE_CREATE "path=$WT_PATH base=origin/$BRANCH"
    git worktree add --detach "$WT_PATH" "origin/$BRANCH" >/dev/null 2>&1 \
        || { bash "$SCRIPT_DIR/log_event.sh" "$AID" WORKTREE_FAIL "git worktree add failed"; exit 1; }
fi

if [ ! -f "$WT_PATH/packages/app/.env.local" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" STACK_SETUP "setup-worktree.sh $INDEX (pnpm install + docker compose + migrations)"
    (cd "$WT_PATH" && bash "$REPO_ROOT/scripts/setup-worktree.sh" "$INDEX") >/dev/null 2>&1 \
        || { bash "$SCRIPT_DIR/log_event.sh" "$AID" STACK_FAIL "setup-worktree.sh failed (index=$INDEX)"; exit 1; }
fi
bash "$SCRIPT_DIR/log_event.sh" "$AID" STACK_READY "wt=$WT_PATH index=$INDEX port=$PORT"

# ---- Build the prompt for the agent ----
PROMPT="Tu es invoqué par la pipeline d'orchestration en fin d'epic #${EPIC_N}, une fois TOUS les sous-tickets squash-mergés dans ${BRANCH}. Le code complet de la feature est intégré.

Unité à couvrir : epic #${EPIC_N} (Feature)
Worktree : ${WT_PATH} (détaché sur origin/${BRANCH})
Worktree index : ${INDEX} (dev server port = ${PORT})
Base de comparaison : origin/alpha  (le diff de la feature = origin/alpha...HEAD)

L'orchestrateur a déjà :
- créé le worktree détaché sur origin/${BRANCH}
- lancé setup-worktree.sh ${INDEX} (stack docker + .env.local avec PORT=${PORT} + migrations OK)

Suivre STRICTEMENT le workflow de .claude/agents/e2e-dev/AGENT.md :
1. Lire le diff intégré (origin/alpha...HEAD) + le body de l'epic et de ses sous-tickets.
2. Démarrer le dev server sur le port ${PORT} (lire PORT dans packages/app/.env.local) et exporter PLAYWRIGHT_BASE_URL=http://localhost:${PORT}.
3. Lancer la suite E2E actuelle (pnpm --filter app test:e2e), trier les échecs (régression vs évolution légitime).
4. Sur >=1 régression réelle : commenter \`e2e-dev:\` sur l'epic #${EPIC_N}, NE RIEN corriger côté source, retourner {\"status\":\"regression\",...}.
5. Sinon : corriger les E2E en échec légitime, puis décider de la couverture de la feature (imbriquer de préférence dans un scénario global existant ; nouveau fichier seulement pour un parcours/page réellement nouveaux).
6. Relancer la suite -> tout vert. typecheck + lint verts.
7. Commit (\`test(e2e): epic-${EPIC_N} — <résumé>\`) puis PUSH avec : \`git push origin HEAD:${BRANCH}\` (le worktree est détaché — pousse explicitement vers ${BRANCH}).
8. Retourner le JSON final.

REGLES STRICTES :
- Ne modifie JAMAIS le code source — ton seul write porte sur src/e2e/**. Toute correction source = handback \`regression\`.
- Pas d'affaiblissement de test (.skip/.fixme/.only interdits).
- N'invoque AUCUN skill built-in. Ne modifie JAMAIS .claude/settings*.json. Pas d'auto-mémoire.
- Pas de --no-verify, pas de --no-gpg-sign, pas de Co-Authored-By.
- N'ouvre ni ne merge aucune PR. Ne bouge pas le board.

Format de retour OBLIGATOIRE — un seul de :
  {\"status\":\"validated\",\"scope\":\"epic\",\"id\":${EPIC_N},\"tests\":{\"mode\":\"nested|new|none\",\"files\":[...]},\"regressions_fixed\":<K>,\"commit\":\"<sha>|none\"}
  {\"status\":\"regression\",\"scope\":\"epic\",\"id\":${EPIC_N},\"regressions\":[{\"test\":\"...\",\"expected\":\"...\",\"got\":\"...\",\"suspect\":\"...\"}]}
  {\"status\":\"rate_limited\",\"id\":${EPIC_N},\"retry_in\":<sec>}
  {\"status\":\"failed\",\"id\":${EPIC_N},\"reason\":\"...\"}

Ton dernier message DOIT être uniquement ce JSON (rien d'autre, pas de prose)."

# ---- Spawn the agent ----
TICK_DIR="$REPO_ROOT/.claude/state/epic_run/e2e_dev/${EPIC_N}"
mkdir -p "$TICK_DIR"
AGENT_LOG="$TICK_DIR/run_$(date -u +%Y%m%dT%H%M%SZ).json"

cd "$WT_PATH"
set +e
$TIMEOUT_PREFIX env -u CLAUDECODE claude \
    --agent e2e-dev \
    --model opus \
    --print \
    --output-format json \
    --dangerously-skip-permissions \
    --max-budget-usd "$BUDGET" \
    "$PROMPT" \
    > "$AGENT_LOG" 2>&1
CLI_RC=$?
set -e
cd "$REPO_ROOT"

# ---- Parse JSON return (mirror run_doc_writer.sh) ----
if [ ! -s "$AGENT_LOG" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "empty_output cli_rc=$CLI_RC"
    echo "WARN e2e-dev: empty output (rc=$CLI_RC) — continuing without E2E coverage" >&2
    exit 1
fi

RESULT_TEXT=$(jq -r '.result // empty' "$AGENT_LOG" 2>/dev/null || echo "")
if [ -z "$RESULT_TEXT" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "non_json_wrapper cli_rc=$CLI_RC"
    echo "WARN e2e-dev: malformed CLI wrapper output — continuing without E2E coverage" >&2
    exit 1
fi

RESULT_JSON=$(echo "$RESULT_TEXT" | grep -oE '\{"status":"[^"]+"[^}]*\}' | tail -1)
if [ -z "$RESULT_JSON" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "no_status_json"
    echo "WARN e2e-dev: agent did not return a status JSON — continuing without E2E coverage" >&2
    exit 1
fi

STATUS=$(echo "$RESULT_JSON" | jq -r '.status' 2>/dev/null || echo "")

case "$STATUS" in
    validated)
        MODE=$(echo "$RESULT_JSON" | jq -r '.tests.mode // "?"' 2>/dev/null || echo "?")
        COMMIT=$(echo "$RESULT_JSON" | jq -r '.commit // "none"' 2>/dev/null || echo "none")
        FIXED=$(echo "$RESULT_JSON" | jq -r '.regressions_fixed // 0' 2>/dev/null || echo "0")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" VALIDATED "epic=$EPIC_N mode=$MODE fixed=$FIXED commit=$COMMIT"
        echo "OK e2e-dev epic=$EPIC_N: validated (mode=$MODE, ${FIXED} E2E corrigés, commit=$COMMIT)"
        exit 0
        ;;
    regression)
        bash "$SCRIPT_DIR/log_event.sh" "$AID" E2E_REGRESSION "epic=$EPIC_N — see e2e-dev: comment on the epic"
        echo "WARN e2e-dev epic=$EPIC_N: REGRESSION détectée — voir le commentaire e2e-dev: sur l'epic. Final PR ouverte quand même (revue humaine)." >&2
        exit 3
        ;;
    rate_limited)
        RETRY=$(echo "$RESULT_JSON" | jq -r '.retry_in // 0' 2>/dev/null || echo "0")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" RATE_LIMITED "retry_in=$RETRY"
        echo "WARN e2e-dev epic=$EPIC_N: rate_limited (retry_in=$RETRY) — skipping E2E coverage" >&2
        exit 2
        ;;
    failed|*)
        REASON=$(echo "$RESULT_JSON" | jq -r '.reason // "unknown"' 2>/dev/null || echo "unknown")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "$REASON"
        echo "WARN e2e-dev epic=$EPIC_N: failed ($REASON) — continuing without E2E coverage" >&2
        exit 1
        ;;
esac
