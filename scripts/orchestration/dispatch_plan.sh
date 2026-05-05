#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# dispatch_plan.sh <epic_N1> [<epic_N2> ...]
#
# Computes the next-tick dispatch plan for one or more active epics.
# Output: a JSON array (possibly empty) with one entry per dispatchable ticket:
#
#   [
#     {"ticket":123,"index":0,"agent":"code-dev","model":"sonnet","epic":42,"base_branch":"origin/epic/42"},
#     {"ticket":124,"index":1,"agent":"code-dev","model":"opus",  "epic":42,"base_branch":"origin/epic/42"}
#   ]
#
# Every ticket targets `origin/epic/<N>`. A ticket whose `Depends on`
# references a parent ticket is dispatchable as soon as the parent's PR has
# been squash-merged into epic/<N> — detected by the absence of the parent's
# `ticket/<parent>-*` branch on origin (GitHub auto-deletes the head branch
# on squash-merge). Until then the child stays blocked.
#
# The board status of the parent is purely decorative (the user owns the
# In review / Done transitions); the canonical signal is **branch presence
# on origin**.
#
# Logic:
#   1. Detect busy worktree indices from existing worktrees `egapro-epic*-t*`
#      (each carries a PORT=3001+N line in packages/app/.env.local).
#   2. For each epic in arg order (= strict priority):
#      a. Bulk-query sub-issues with labels + board status (cache key
#         `epic_<N>_full`, TTL 300s, shared with epic_state.sh).
#      b. For each sub-issue still in 'Todo':
#         - Skip if label `dispatch=escalate` (manual hold)
#         - Parse `## Depends on` from the body for inter-ticket deps
#         - Resolve each dep: dispatchable iff its `ticket/<N>-*` branch is
#           gone from origin (= squash-merged into epic/<N>).
#   3. Assign candidates greedily to the first free index in
#      [0, EPIC_MAX_PARALLEL[ (default 5).
#
# Env:
#   EPIC_MAX_PARALLEL   — max concurrent worktrees (default 5, range 1-5)
#   EGAPRO_STATE_ROOT   — state dir (default: derived from script path)

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <epic_N1> [<epic_N2> ...]" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

MAX_PARALLEL="${EPIC_MAX_PARALLEL:-5}"
[ "$MAX_PARALLEL" -lt 1 ] && MAX_PARALLEL=1
[ "$MAX_PARALLEL" -gt 5 ] && MAX_PARALLEL=5

# ---- 1. Detect busy worktree indices ----
# A worktree at `<...>/egapro-epic<N>-t<TID>` is busy if it exists. Its index
# is recovered from PORT=3001+N in packages/app/.env.local. If a worktree was
# never properly set up, skip it (it'll re-setup on next dispatch).
declare -A INDEX_BUSY
for i in $(seq 0 $((MAX_PARALLEL - 1))); do
    INDEX_BUSY[$i]=0
done

while IFS= read -r path; do
    [ -n "$path" ] || continue
    case "$(basename "$path")" in
        egapro-epic*-t*) ;;
        *) continue ;;
    esac
    ENV_FILE="$path/packages/app/.env.local"
    [ -f "$ENV_FILE" ] || continue
    PORT_LINE=$(grep '^PORT=' "$ENV_FILE" | head -1 | cut -d= -f2 || true)
    [[ "$PORT_LINE" =~ ^[0-9]+$ ]] || continue
    IDX=$((PORT_LINE - 3001))
    if [ "$IDX" -ge 0 ] && [ "$IDX" -lt "$MAX_PARALLEL" ]; then
        INDEX_BUSY[$IDX]=1
    fi
done < <(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2}')

# ---- 2. For each epic, collect candidates ----
declare -a CANDIDATES   # entries: "ticket|model|epic|base_branch"

for EPIC_N in "$@"; do
    # Resolve epic node ID (cache 1h)
    EPIC_ID=$("$SCRIPT_DIR/cache_gh.sh" "epic_${EPIC_N}_id" 3600 -- gh issue view "$EPIC_N" --json id --jq '.id' 2>/dev/null || echo "")
    [ -z "$EPIC_ID" ] && continue

    # Bulk query: sub-issues + labels + board status + body
    SUB_ISSUES=$("$SCRIPT_DIR/cache_gh.sh" "epic_${EPIC_N}_full" 300 -- gh api graphql -f query="{
        node(id: \"${EPIC_ID}\") {
            ... on Issue {
                subIssues(first: 50) {
                    nodes {
                        number
                        body
                        state
                        labels(first: 10) { nodes { name } }
                        projectItems(first: 1) {
                            nodes {
                                fieldValues(first: 10) {
                                    nodes {
                                        ... on ProjectV2ItemFieldSingleSelectValue {
                                            field { ... on ProjectV2SingleSelectField { name } }
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }" --jq '.data.node.subIssues.nodes')

    [ -z "$SUB_ISSUES" ] || [ "$SUB_ISSUES" = "null" ] && continue

    # Build a lookup: ticket_number → {status, labels} from the bulk query
    # (used to resolve dep statuses without additional API calls)
    declare -A SUB_STATUS
    declare -A SUB_LABELS
    while IFS= read -r issue; do
        N=$(echo "$issue" | jq -r '.number')
        S=$(echo "$issue" | jq -r '.projectItems.nodes[0].fieldValues.nodes[]? | select(.field.name == "Status") | .name' | head -1 || true)
        L=$(echo "$issue" | jq -r '[.labels.nodes[].name] | join(",")')
        SUB_STATUS[$N]="$S"
        SUB_LABELS[$N]="$L"
    done < <(echo "$SUB_ISSUES" | jq -c '.[]')

    # Iterate sub-issues, build candidate list
    while IFS= read -r issue; do
        N=$(echo "$issue" | jq -r '.number')
        BODY=$(echo "$issue" | jq -r '.body // ""')
        STATUS="${SUB_STATUS[$N]:-}"
        LABELS="${SUB_LABELS[$N]:-}"

        # Filter by status: only 'Todo' (and synonyms) is dispatchable
        case "$STATUS" in
            Todo|"To Do"|"To do")  ;;
            *) continue ;;
        esac

        # Skip if held by user
        if echo "$LABELS" | grep -qE '(^|,)dispatch=escalate(,|$)'; then
            continue
        fi

        # Parse `## Depends on` section from body — collect referenced #N numbers
        # until the next `##` heading or EOF. `|| true` because grep returns 1
        # when the section is empty or 'N/A', which would trip pipefail.
        DEPS=$(echo "$BODY" | awk '
            /^## Depends on/ { capture=1; next }
            /^## / && capture { capture=0 }
            capture { print }
        ' | grep -oE '#[0-9]+' | tr -d '#' | sort -u || true)

        # Resolve deps: each parent must be squash-merged into epic/<N>.
        # Repo settings auto-delete the head branch on merge, so parent
        # ticket branch absence on origin == merged. The board status is
        # decorative (humans own In review / Done) — branch presence is
        # the canonical signal.
        BASE_BRANCH="origin/epic/${EPIC_N}"
        BLOCKED=0
        for DEP in $DEPS; do
            DEP_BRANCH=$(git ls-remote --heads origin "ticket/${DEP}-*" 2>/dev/null | awk '{print $2}' | head -1 || true)
            if [ -n "$DEP_BRANCH" ]; then
                # Branch still on origin → not yet squash-merged → child blocked
                BLOCKED=1
                break
            fi
        done

        [ "$BLOCKED" = "1" ] && continue

        # Model: opus if `complexe` label is set, sonnet otherwise
        MODEL="sonnet"
        if echo "$LABELS" | grep -qE '(^|,)complexe(,|$)'; then
            MODEL="opus"
        fi

        CANDIDATES+=("${N}|${MODEL}|${EPIC_N}|${BASE_BRANCH}")
    done < <(echo "$SUB_ISSUES" | jq -c '.[]')
done

# ---- 3. Greedy assign to free indices ----
ENTRIES=()
for entry in "${CANDIDATES[@]:-}"; do
    [ -n "$entry" ] || continue
    IFS='|' read -r TICKET MODEL EPIC BASE <<< "$entry"

    ASSIGNED_IDX=""
    for i in $(seq 0 $((MAX_PARALLEL - 1))); do
        if [ "${INDEX_BUSY[$i]}" = "0" ]; then
            ASSIGNED_IDX=$i
            INDEX_BUSY[$i]=1
            break
        fi
    done

    [ -z "$ASSIGNED_IDX" ] && break  # all slots busy, stop dispatching

    ENTRIES+=("$(printf '{"ticket":%d,"index":%d,"agent":"code-dev","model":"%s","epic":%d,"base_branch":"%s"}' \
        "$TICKET" "$ASSIGNED_IDX" "$MODEL" "$EPIC" "$BASE")")
done

# Emit JSON array
if [ ${#ENTRIES[@]} -eq 0 ]; then
    echo "[]"
else
    echo "["
    for i in "${!ENTRIES[@]}"; do
        if [ "$i" -lt "$((${#ENTRIES[@]} - 1))" ]; then
            echo "  ${ENTRIES[$i]},"
        else
            echo "  ${ENTRIES[$i]}"
        fi
    done
    echo "]"
fi
