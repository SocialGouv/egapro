#!/usr/bin/env bash
#
# epic_dag.sh <epic_number> — emit the FULL remaining sub-ticket DAG of an epic
# as a JSON object the iterion `fan_out_each` router can schedule natively.
#
# Output (stdout):
#   {"tickets":[
#     {"id":"123","deps":["120"],"model":"sonnet","base":"origin/epic/42","title":"…"},
#     {"id":"124","deps":[],      "model":"opus",  "base":"origin/epic/42","title":"…"}
#   ]}
#
# This is the data-driven counterpart of dispatch_plan.sh. Where dispatch_plan
# emits only the tickets dispatchable in the CURRENT bash tick (deps already
# squash-merged, a free worktree index assigned), epic_dag emits the WHOLE set
# of not-yet-merged sub-tickets together with their inter-ticket dependencies,
# and lets the iterion engine do the topological scheduling (`key:`+`depends_on:`
# on the fan_out_each router) and the concurrency capping (max_parallel_branches
# / a worktree_slot resource). One emit per fan-out run; on a rework round the
# iterion loop re-invokes this to pick up newly-created fix tickets.
#
# Scheduling contract reproduced here (same rules as dispatch_plan.sh):
#   * a sub-ticket is "remaining" iff its board Status is To Do and it does NOT
#     carry the `dispatch=escalate` hold label. A ticket already squash-merged
#     into epic/<N> has been moved off To Do, so it naturally drops out.
#   * `## Depends on` (body section, `#N` tokens) gives the parents. We keep only
#     the parents that are THEMSELVES still remaining — a parent already merged
#     is a satisfied dependency and is pruned, so the engine won't wait on it.
#   * model = opus iff the sub-issue carries the `complexe` label, else sonnet.
#
# Deterministic, read-only (no board writes). Exit 0 always emits valid JSON
# (an empty {"tickets":[]} when the epic has no remaining sub-tickets), so the
# fan_out_each `over:` source is never nil.

set -euo pipefail

REPO="${EGAPRO_REPO:-SocialGouv/egapro}"
EPIC_N="${1:-}"

if [ -z "$EPIC_N" ]; then
    echo "usage: epic_dag.sh <epic_number>" >&2
    exit 2
fi

emit_empty() { printf '{"tickets":[]}'; }

# Resolve the epic's GraphQL node id (needed for the subIssues connection).
EPIC_ID=$(gh issue view "$EPIC_N" --repo "$REPO" --json id --jq '.id' 2>/dev/null || echo "")
if [ -z "$EPIC_ID" ]; then
    emit_empty
    exit 0
fi

# Bulk query: sub-issues + body + labels + board status (single call).
SUB_ISSUES=$(gh api graphql -f query='
query($id: ID!) {
  node(id: $id) {
    ... on Issue {
      subIssues(first: 50) {
        nodes {
          number
          title
          body
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
}' -f id="$EPIC_ID" --jq '.data.node.subIssues.nodes' 2>/dev/null || echo "")

if [ -z "$SUB_ISSUES" ] || [ "$SUB_ISSUES" = "null" ]; then
    emit_empty
    exit 0
fi

BASE_BRANCH="origin/epic/${EPIC_N}"

# --- Pass 1: build the "remaining" set (To Do, not held) -----------------------
declare -A REMAINING=()   # ticket number -> 1
declare -A MODEL=()       # ticket number -> sonnet|opus
declare -A TITLE=()       # ticket number -> title
declare -A BODY=()        # ticket number -> body

while IFS= read -r issue; do
    [ -n "$issue" ] || continue
    N=$(echo "$issue" | jq -r '.number')
    T=$(echo "$issue" | jq -r '.title // ""')
    B=$(echo "$issue" | jq -r '.body // ""')
    L=$(echo "$issue" | jq -r '[.labels.nodes[].name] | join(",")')
    S=$(echo "$issue" | jq -r '[.projectItems.nodes[0].fieldValues.nodes[]? | select(.field.name == "Status") | .name] | first // ""')

    case "$S" in
        Todo|"To Do"|"To do") ;;
        *) continue ;;
    esac
    if echo "$L" | grep -qE '(^|,)dispatch=escalate(,|$)'; then
        continue
    fi

    REMAINING[$N]=1
    TITLE[$N]="$T"
    BODY[$N]="$B"
    if echo "$L" | grep -qE '(^|,)complexe(,|$)'; then
        MODEL[$N]="opus"
    else
        MODEL[$N]="sonnet"
    fi
done < <(echo "$SUB_ISSUES" | jq -c '.[]')

if [ ${#REMAINING[@]} -eq 0 ]; then
    emit_empty
    exit 0
fi

# --- Pass 2: per remaining ticket, deps = parents that are also remaining -------
ENTRIES=()
for N in "${!REMAINING[@]}"; do
    # Parse `## Depends on` section -> referenced #parent numbers (same awk as
    # dispatch_plan.sh). `|| true` because grep exits 1 on an empty section.
    PARENTS=$(printf '%s\n' "${BODY[$N]}" | awk '
        /^## Depends on/ { capture=1; next }
        /^## / && capture { capture=0 }
        capture { print }
    ' | grep -oE '#[0-9]+' | tr -d '#' | sort -u || true)

    DEPS_JSON="[]"
    for P in $PARENTS; do
        # Keep the dep only if the parent is itself still remaining; a parent
        # already merged into epic/<N> (off To Do) is a satisfied dependency.
        if [ "${REMAINING[$P]:-}" = "1" ]; then
            DEPS_JSON=$(echo "$DEPS_JSON" | jq -c --arg p "$P" '. + [$p]')
        fi
    done

    ENTRIES+=("$(jq -nc \
        --arg id "$N" \
        --argjson deps "$DEPS_JSON" \
        --arg model "${MODEL[$N]}" \
        --arg base "$BASE_BRANCH" \
        --arg title "${TITLE[$N]}" \
        '{id: $id, deps: $deps, model: $model, base: $base, title: $title}')")
done

# Stable order (ascending ticket number) for reproducible plans.
printf '%s\n' "${ENTRIES[@]}" \
    | jq -sc 'sort_by(.id | tonumber) | {tickets: .}'
