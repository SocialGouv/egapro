#!/usr/bin/env bash
#
# Invokes the doc-writer agent on an epic integration branch (epic/<N>) to
# regenerate `docs/*.md` from the current code state, then commits + pushes
# on epic/<N>. Called by epic_loop.sh just before open_epic_final_pr.sh, so
# the doc commit ships in the same final PR as the code.
#
# The agent runs from the **main worktree** (which epic_loop.sh keeps on
# epic/<N> for the duration of the epic). No dedicated worktree, no docker
# stack — doc-writer only reads files and writes markdown.
#
# Usage:
#   bash scripts/orchestration/run_doc_writer.sh <epic_N>
#
# Exit codes:
#   0  agent returned `updated` or `no_changes` (both successful outcomes)
#   1  technical failure (claude CLI missing, malformed JSON, push refused)
#   2  agent returned `rate_limited` (transient, caller may retry later)
#
# Hard rule: NEVER fails the epic. If doc-writer crashes or the API rate-
# limits, the caller (epic_loop.sh) logs the issue and proceeds with
# open_epic_final_pr.sh. Doc updates are nice-to-have, not blocking.
#
# Env (defaults shown):
#   EPIC_LOOP_BUDGET_DOC      5      USD max for the doc-writer Sonnet run
#   EPIC_LOOP_AGENT_TIMEOUT   1800   seconds max (30 min — doc tasks are short)

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

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AID="doc-writer-${EPIC_N}"

BUDGET="${EPIC_LOOP_BUDGET_DOC:-5}"
AGENT_TIMEOUT="${EPIC_LOOP_AGENT_TIMEOUT:-1800}"

# ---- Verify we are on epic/<N> ----
cd "$REPO_ROOT"
CURRENT=$(git branch --show-current)
EXPECTED="epic/${EPIC_N}"

if [ "$CURRENT" != "$EXPECTED" ]; then
    echo "ERROR: expected to run from $EXPECTED but currently on $CURRENT" >&2
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "wrong_branch=$CURRENT"
    exit 1
fi

# ---- Pre-flight: working tree must be clean ----
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: working tree dirty on $EXPECTED — refusing to invoke doc-writer" >&2
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "working_tree_dirty"
    exit 1
fi

git fetch origin alpha "$EXPECTED" --quiet

bash "$SCRIPT_DIR/log_event.sh" "$AID" START "epic=$EPIC_N branch=$EXPECTED"

# ---- timeout binary detection (mirror epic_loop.sh) ----
TIMEOUT_BIN=""
if command -v gtimeout >/dev/null 2>&1; then
    TIMEOUT_BIN="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
    TIMEOUT_BIN="timeout"
fi
TIMEOUT_PREFIX=""
[ -n "$TIMEOUT_BIN" ] && TIMEOUT_PREFIX="$TIMEOUT_BIN $AGENT_TIMEOUT"

# ---- Build prompt for the agent ----
PROMPT="Tu es invoqué par la pipeline d'orchestration en fin d'epic #${EPIC_N}.

Branche courante : ${EXPECTED} (le main worktree y a été aligné par /implement).
Base de comparaison : origin/alpha
Mode : pipeline (commit auto + push sur ${EXPECTED})

Suivre STRICTEMENT le workflow de .claude/agents/doc-writer/AGENT.md :

1. Calcule le diff fonctionnel (origin/alpha...HEAD).
2. Heuristique no-op : si rien sous packages/app/src/{app,modules,server}/ n'a changé → retourne immédiatement {\"status\":\"no_changes\",\"epic\":${EPIC_N},\"reason\":\"...\"}.
3. Sinon : régénère from scratch les fichiers docs/*.md impactés (features.md / architecture.md / parcours-utilisateurs.md). Lis le code de la branche, pas seulement le diff — la doc reflète l'état final.
4. Vérifie chaque fait factuel (constantes, routes, schémas) contre le code via Read/Grep — aucune hallucination.
5. pnpm format:check, puis check:write si besoin.
6. git add docs/ && git commit -m \"docs(epic-${EPIC_N}): regenerate from current code state\" && git push origin HEAD.
7. Retourne le JSON.

REGLES STRICTES :
- N'invoque AUCUN skill built-in (fewer-permission-prompts, update-config, etc.)
- Ne modifie JAMAIS .claude/settings.json ni .claude/settings.local.json
- Pas d'auto-mémoire (~/.claude/projects/.../memory/)
- Aucun fichier hors docs/ ne doit être modifié
- Pas de --no-verify, pas de --no-gpg-sign

Format de retour OBLIGATOIRE — un seul de :
  {\"status\":\"updated\",\"epic\":${EPIC_N},\"branch\":\"${EXPECTED}\",\"files\":[...],\"commit\":\"<sha>\"}
  {\"status\":\"no_changes\",\"epic\":${EPIC_N},\"branch\":\"${EXPECTED}\",\"reason\":\"...\"}
  {\"status\":\"rate_limited\",\"epic\":${EPIC_N},\"retry_in\":<sec>}
  {\"status\":\"failed\",\"epic\":${EPIC_N},\"reason\":\"...\"}

Ton dernier message DOIT être uniquement ce JSON (rien d'autre, pas de prose)."

# ---- Spawn the agent ----
TICK_DIR="$REPO_ROOT/.claude/state/epic_run/doc_writer/${EPIC_N}"
mkdir -p "$TICK_DIR"
AGENT_LOG="$TICK_DIR/run_$(date -u +%Y%m%dT%H%M%SZ).json"

set +e
$TIMEOUT_PREFIX env -u CLAUDECODE claude \
    --agent doc-writer \
    --model sonnet \
    --print \
    --output-format json \
    --dangerously-skip-permissions \
    --max-budget-usd "$BUDGET" \
    "$PROMPT" \
    > "$AGENT_LOG" 2>&1
CLI_RC=$?
set -e

# ---- Parse JSON return ----
# The claude CLI emits a wrapper {result, is_error, ...}. Extract .result then
# parse the agent's last message for the strict-format JSON.
if [ ! -s "$AGENT_LOG" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "empty_output cli_rc=$CLI_RC"
    echo "WARN doc-writer: empty output (rc=$CLI_RC) — continuing without doc update" >&2
    exit 1
fi

RESULT_TEXT=$(jq -r '.result // empty' "$AGENT_LOG" 2>/dev/null || echo "")
if [ -z "$RESULT_TEXT" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "non_json_wrapper cli_rc=$CLI_RC"
    echo "WARN doc-writer: malformed CLI wrapper output — continuing without doc update" >&2
    exit 1
fi

# Extract the last JSON object from the agent's result text
RESULT_JSON=$(echo "$RESULT_TEXT" | grep -oE '\{"status":"[^"]+"[^}]*\}' | tail -1)
if [ -z "$RESULT_JSON" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "no_status_json"
    echo "WARN doc-writer: agent did not return a status JSON — continuing without doc update" >&2
    exit 1
fi

STATUS=$(echo "$RESULT_JSON" | jq -r '.status' 2>/dev/null || echo "")

case "$STATUS" in
    updated)
        FILES=$(echo "$RESULT_JSON" | jq -r '.files | join(",")' 2>/dev/null || echo "")
        COMMIT=$(echo "$RESULT_JSON" | jq -r '.commit // ""' 2>/dev/null || echo "")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" UPDATED "files=$FILES commit=$COMMIT"
        echo "OK doc-writer epic=$EPIC_N: updated $FILES (commit $COMMIT)"
        exit 0
        ;;
    no_changes)
        REASON=$(echo "$RESULT_JSON" | jq -r '.reason // ""' 2>/dev/null || echo "")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" NO_CHANGES "$REASON"
        echo "OK doc-writer epic=$EPIC_N: no_changes ($REASON)"
        exit 0
        ;;
    rate_limited)
        RETRY=$(echo "$RESULT_JSON" | jq -r '.retry_in // 0' 2>/dev/null || echo "0")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" RATE_LIMITED "retry_in=$RETRY"
        echo "WARN doc-writer epic=$EPIC_N: rate_limited (retry_in=$RETRY) — skipping doc update" >&2
        exit 2
        ;;
    failed|*)
        REASON=$(echo "$RESULT_JSON" | jq -r '.reason // "unknown"' 2>/dev/null || echo "unknown")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "$REASON"
        echo "WARN doc-writer epic=$EPIC_N: failed ($REASON) — continuing without doc update" >&2
        exit 1
        ;;
esac
