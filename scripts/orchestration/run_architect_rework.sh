#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
#
# Invokes the architect-rework agent on an epic that needs rework. Two sources:
#
#   1. e2e-regression (no 2nd arg) — called by epic_loop.sh's BLOCKING E2E gate
#      when e2e-dev returned `regression`. The agent reads the `e2e-dev:` comment.
#      On a functional doubt it posts a question + sets dispatch=escalate (the
#      next tick's ESCALATE check halts the background orchestrator).
#
#   2. user-feedback (2nd arg = free-text) — called by the /implement skill's
#      end-of-pipeline acceptance gate when the user tested the implementation
#      and requested changes. The 2nd arg IS the change request. On a functional
#      doubt the agent only returns `needs_user` (NO escalate label) — the
#      foreground skill relays the question to the user who is present.
#
# In both cases the agent diagnoses the need and creates one or more fix Task
# sub-issues (To Do, picked up by dispatch_plan) — or asks for clarification.
#
# Runs from the **main worktree** (kept on epic/<N> by /implement). No dedicated
# worktree, no docker stack — the agent only reads code and writes GitHub issues.
#
# Usage:
#   bash scripts/orchestration/run_architect_rework.sh <epic_N>               # e2e-regression
#   bash scripts/orchestration/run_architect_rework.sh <epic_N> "<feedback>"  # user-feedback
#
# Exit codes:
#   0  agent returned `tickets_created` (fix tickets exist → loop reprocesses them)
#   1  technical failure (claude CLI missing, malformed JSON, agent `failed`)
#   2  agent returned `needs_user` (functional doubt). e2e-regression mode: the
#      agent set dispatch=escalate (orchestrator halts). user-feedback mode: the
#      caller relays the question to the user.
#   3  agent returned `rate_limited` (transient — caller retries)
#
# Env (defaults shown):
#   EPIC_LOOP_BUDGET_REWORK   10     USD max for the architect-rework Opus run
#   EPIC_LOOP_AGENT_TIMEOUT   1800   seconds max (30 min — analysis + issue creation)

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <epic_N> [<user-feedback>]" >&2
    echo "  no <user-feedback>  → e2e-regression mode (reads the e2e-dev: comment on the epic)" >&2
    echo "  with <user-feedback> → user-feedback mode (the text is the requested change)" >&2
    exit 1
fi

EPIC_N="$1"
if ! [[ "$EPIC_N" =~ ^[0-9]+$ ]]; then
    echo "ERROR: epic number must be a positive integer (got: $EPIC_N)" >&2
    exit 1
fi

# Optional 2nd arg = free-text user change request → switches to user-feedback
# mode (acceptance gate). Empty/absent → e2e-regression mode (default, called by
# epic_loop.sh's E2E gate).
FEEDBACK="${2:-}"
if [ -n "$FEEDBACK" ]; then
    SOURCE="user-feedback"
else
    SOURCE="e2e-regression"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AID="architect-rework-${EPIC_N}"
EXPECTED="epic/${EPIC_N}"

BUDGET="${EPIC_LOOP_BUDGET_REWORK:-10}"
AGENT_TIMEOUT="${EPIC_LOOP_AGENT_TIMEOUT:-1800}"

# ---- Verify we are on epic/<N> ----
cd "$REPO_ROOT"
CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "$EXPECTED" ]; then
    echo "ERROR: expected to run from $EXPECTED but currently on $CURRENT" >&2
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "wrong_branch=$CURRENT"
    exit 1
fi

git fetch origin alpha "$EXPECTED" --quiet 2>/dev/null || true

bash "$SCRIPT_DIR/log_event.sh" "$AID" START "epic=$EPIC_N branch=$EXPECTED source=$SOURCE"

# ---- timeout binary detection (mirror run_doc_writer.sh) ----
TIMEOUT_BIN=""
if command -v gtimeout >/dev/null 2>&1; then
    TIMEOUT_BIN="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
    TIMEOUT_BIN="timeout"
fi
TIMEOUT_PREFIX=""
[ -n "$TIMEOUT_BIN" ] && TIMEOUT_PREFIX="$TIMEOUT_BIN $AGENT_TIMEOUT"

# ---- Build the source-specific instruction block ----
if [ "$SOURCE" = "user-feedback" ]; then
    SOURCE_BLOCK="SOURCE DU REWORK : retour utilisateur (gate d'acceptation en fin de pipeline). L'utilisateur a testé l'implémentation de l'epic #${EPIC_N} et demande le(s) changement(s) suivant(s) :
---
${FEEDBACK}
---

Suivre STRICTEMENT le workflow de .claude/agents/architect-rework/AGENT.md (source = user-feedback) :
1. Comprendre la demande de changement ci-dessus ; lire le code intégré concerné (git diff origin/alpha...HEAD + fichiers pertinents) pour la traduire en travail exécutable.
2. DÉCIDER :
   - Doute fonctionnel (la demande est ambiguë ou incomplète) → retourner {\"status\":\"needs_user\",\"epic\":${EPIC_N},\"question\":\"...\"}. NE PAS poser de label dispatch=escalate (le skill /implement, en foreground, relaiera ta question à l'utilisateur présent). NE CRÉE AUCUN ticket tant que ce n'est pas clarifié.
   - Demande claire → créer un/plusieurs tickets Task (sous-issues de #${EPIC_N}, To Do) implémentant le changement, en suivant EXACTEMENT les conventions de l'agent architect (mode epic-enrich) : spec rules/ticket-spec-format.md dans le body, type + ajout project + parent link + To Do via rules/github-board.md, sizing via set_ticket_size.sh. Retourner {\"status\":\"tickets_created\",...}."
else
    SOURCE_BLOCK="SOURCE DU REWORK : régression E2E. La gate E2E bloquante de l'epic #${EPIC_N} a échoué ; l'agent e2e-dev a posté un commentaire \`e2e-dev:\` sur l'epic décrivant la régression (test E2E en échec, parcours cassé, fichier source suspecté).

Suivre STRICTEMENT le workflow de .claude/agents/architect-rework/AGENT.md (source = e2e-regression) :
1. Lire le commentaire \`e2e-dev:\` le plus récent sur l'epic #${EPIC_N}.
2. Diagnostiquer la root cause (git diff origin/alpha...HEAD + fichiers suspectés + scénario E2E qui casse).
3. DÉCIDER :
   - Doute fonctionnel / arbitrage produit → poster un commentaire \`architect-rework:\` avec la question précise, \`gh issue edit ${EPIC_N} --add-label dispatch=escalate\`, retourner {\"status\":\"needs_user\",...}. NE CRÉE AUCUN ticket.
   - Cause claire → créer un/plusieurs tickets Task de fix (sous-issues de #${EPIC_N}, To Do) en suivant EXACTEMENT les conventions de l'agent architect (mode epic-enrich) : spec rules/ticket-spec-format.md dans le body, type + ajout project + parent link + To Do via rules/github-board.md, sizing via set_ticket_size.sh. Retourner {\"status\":\"tickets_created\",...}."
fi

# ---- Build prompt for the agent ----
PROMPT="Tu es invoqué par la pipeline d'orchestration pour l'epic #${EPIC_N}.

Branche courante : ${EXPECTED} (le main worktree y a été aligné).
Base de comparaison : origin/alpha

${SOURCE_BLOCK}

REGLES STRICTES :
- Ne modifie JAMAIS le code ni aucun test — analyse + tickets uniquement.
- Sur doute fonctionnel : demande, ne devine pas.
- N'invoque AUCUN skill built-in. Ne modifie JAMAIS .claude/settings*.json. Pas d'auto-mémoire.
- Pas de squash-merge, pas de PR, pas de transition In progress/In review/Done.
- GitHub artefact hygiene (repo public) : pas de secret/PII, données fictives.

Format de retour OBLIGATOIRE — un seul de :
  {\"status\":\"tickets_created\",\"epic\":${EPIC_N},\"tickets\":[<n1>,<n2>]}
  {\"status\":\"needs_user\",\"epic\":${EPIC_N},\"question\":\"...\"}
  {\"status\":\"rate_limited\",\"epic\":${EPIC_N},\"retry_in\":<sec>}
  {\"status\":\"failed\",\"epic\":${EPIC_N},\"reason\":\"...\"}

Ton dernier message DOIT être uniquement ce JSON (rien d'autre, pas de prose)."

# ---- Spawn the agent ----
TICK_DIR="$REPO_ROOT/.claude/state/epic_run/architect_rework/${EPIC_N}"
mkdir -p "$TICK_DIR"
AGENT_LOG="$TICK_DIR/run_$(date -u +%Y%m%dT%H%M%SZ).json"

set +e
$TIMEOUT_PREFIX env -u CLAUDECODE claude \
    --agent architect-rework \
    --model opus \
    --print \
    --output-format json \
    --dangerously-skip-permissions \
    --max-budget-usd "$BUDGET" \
    "$PROMPT" \
    > "$AGENT_LOG" 2>&1
CLI_RC=$?
set -e

# ---- Parse JSON return (mirror run_doc_writer.sh) ----
if [ ! -s "$AGENT_LOG" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "empty_output cli_rc=$CLI_RC"
    echo "WARN architect-rework: empty output (rc=$CLI_RC)" >&2
    exit 1
fi

RESULT_TEXT=$(jq -r '.result // empty' "$AGENT_LOG" 2>/dev/null || echo "")
if [ -z "$RESULT_TEXT" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "non_json_wrapper cli_rc=$CLI_RC"
    echo "WARN architect-rework: malformed CLI wrapper output" >&2
    exit 1
fi

RESULT_JSON=$(echo "$RESULT_TEXT" | grep -oE '\{"status":"[^"]+"[^}]*\}' | tail -1)
if [ -z "$RESULT_JSON" ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "no_status_json"
    echo "WARN architect-rework: agent did not return a status JSON" >&2
    exit 1
fi

STATUS=$(echo "$RESULT_JSON" | jq -r '.status' 2>/dev/null || echo "")

case "$STATUS" in
    tickets_created)
        TICKETS=$(echo "$RESULT_JSON" | jq -r '.tickets | join(",")' 2>/dev/null || echo "")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" TICKETS_CREATED "epic=$EPIC_N tickets=$TICKETS"
        echo "OK architect-rework epic=$EPIC_N: fix tickets created ($TICKETS)"
        exit 0
        ;;
    needs_user)
        Q=$(echo "$RESULT_JSON" | jq -r '.question // ""' 2>/dev/null || echo "")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" NEEDS_USER "epic=$EPIC_N q=$Q"
        echo "ESCALATE architect-rework epic=$EPIC_N: functional doubt — question posted, dispatch=escalate set" >&2
        exit 2
        ;;
    rate_limited)
        RETRY=$(echo "$RESULT_JSON" | jq -r '.retry_in // 0' 2>/dev/null || echo "0")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" RATE_LIMITED "retry_in=$RETRY"
        echo "WARN architect-rework epic=$EPIC_N: rate_limited (retry_in=$RETRY)" >&2
        exit 3
        ;;
    failed|*)
        REASON=$(echo "$RESULT_JSON" | jq -r '.reason // "unknown"' 2>/dev/null || echo "unknown")
        bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "$REASON"
        echo "WARN architect-rework epic=$EPIC_N: failed ($REASON)" >&2
        exit 1
        ;;
esac
