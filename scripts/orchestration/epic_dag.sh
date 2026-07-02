#!/usr/bin/env bash
#
# epic_dag.sh <epic_number> — emit the FULL remaining sub-ticket DAG of an epic
# as a JSON object the iterion `fan_out_each` router can schedule natively.
#
# Output (stdout):
#   {"tickets":[
#     {"id":"123","deps":["120"],"model":"sonnet","base":"origin/epic/42","title":"…"},
#     {"id":"124","deps":[],      "model":"opus",  "base":"origin/epic/42","title":"…"}
#   ], "held": 0}
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
# Scheduling contract (CANONICAL SIGNAL = merged PR, board decorative):
#   * a sub-ticket is "done" iff a MERGED pull request references it via
#     closingIssuesReferences (closedByPullRequestsReferences.merged == true —
#     force_pr_issue_link.sh guarantees the link populates). Board Status is
#     NOT consulted: a ticket left "In progress" by a crashed run stays
#     remaining, so a relaunch re-dispatches it instead of false-converging.
#   * a remaining sub-ticket carrying the `dispatch=escalate` hold label is
#     NOT dispatchable but still BLOCKS convergence: it is excluded from
#     tickets[] and counted in the `held` field. Callers must treat held>0
#     as "not converged" (never open the final PR over a held ticket).
#   * `## Depends on` (body section, `#N` tokens) gives the parents. We keep only
#     the parents that are THEMSELVES still remaining — a parent already merged
#     is a satisfied dependency and is pruned, so the engine won't wait on it.
#   * model = opus iff the sub-issue carries the `complexe` label, else sonnet.
#
# Output: {"tickets":[...], "held": K}
#
# Deterministic, read-only (no board writes). FAILS LOUDLY (exit 1, stderr) on
# a GitHub API error after retries — an empty {"tickets":[]} is emitted ONLY
# when the epic genuinely has zero remaining sub-tickets, never as an error
# fallback (a transient rate-limit must not read as a converged epic).

set -euo pipefail

REPO="${EGAPRO_REPO:-SocialGouv/egapro}"
EPIC_N="${1:-}"

if [ -z "$EPIC_N" ]; then
    echo "usage: epic_dag.sh <epic_number>" >&2
    exit 2
fi

# Retry wrapper for gh calls: transient API blips (rate-limit, 5xx) get 3
# attempts; persistent failure is FATAL (exit 1) — never a silent empty plan.
gh_retry() {
    local out="" attempt
    for attempt in 1 2 3; do
        if out=$("$@" 2>/dev/null) && [ -n "$out" ] && [ "$out" != "null" ]; then
            printf '%s' "$out"
            return 0
        fi
        sleep 5
    done
    return 1
}

# Resolve the epic's GraphQL node id (needed for the subIssues connection).
if ! EPIC_ID=$(gh_retry gh issue view "$EPIC_N" --repo "$REPO" --json id --jq '.id'); then
    echo "epic_dag.sh: FATAL — cannot resolve epic #$EPIC_N node id (GitHub API failure or bad epic number); refusing to emit an empty plan" >&2
    exit 1
fi

# Bulk query: sub-issues + body + labels + merged-PR references (single call).
# closedByPullRequestsReferences(includeClosedPrs:true) + .merged filter = the
# canonical "squash-merged into epic/<N>" signal (board Status is decorative).
if ! SUB_ISSUES=$(gh_retry gh api graphql -f query='
query($id: ID!) {
  node(id: $id) {
    ... on Issue {
      subIssues(first: 50) {
        nodes {
          number
          title
          body
          labels(first: 10) { nodes { name } }
          closedByPullRequestsReferences(first: 10, includeClosedPrs: true) {
            nodes { merged }
          }
        }
      }
    }
  }
}' -f id="$EPIC_ID" --jq '.data.node.subIssues.nodes'); then
    echo "epic_dag.sh: FATAL — subIssues query failed for epic #$EPIC_N (GitHub API failure); refusing to emit an empty plan" >&2
    exit 1
fi

BASE_BRANCH="origin/epic/${EPIC_N}"

# --- Pass 1: build the "remaining" set (NOT merged; escalate-held counted) -----
declare -A REMAINING=()   # ticket number -> 1
declare -A MODEL=()       # ticket number -> sonnet|opus
declare -A TITLE=()       # ticket number -> title
declare -A BODY=()        # ticket number -> body
HELD=0                    # unmerged tickets frozen by dispatch=escalate

while IFS= read -r issue; do
    [ -n "$issue" ] || continue
    N=$(echo "$issue" | jq -r '.number')
    T=$(echo "$issue" | jq -r '.title // ""')
    B=$(echo "$issue" | jq -r '.body // ""')
    L=$(echo "$issue" | jq -r '[.labels.nodes[].name] | join(",")')
    M=$(echo "$issue" | jq -r '[.closedByPullRequestsReferences.nodes[]? | select(.merged == true)] | length')

    # Canonical done signal: a MERGED PR references this ticket. Board status
    # is decorative — an "In progress" leftover from a crashed run is NOT done.
    if [ "${M:-0}" -gt 0 ]; then
        continue
    fi
    if echo "$L" | grep -qE '(^|,)dispatch=escalate(,|$)'; then
        HELD=$((HELD + 1))
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
    printf '{"tickets":[],"held":%s}' "$HELD"
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
    | jq -sc --argjson held "$HELD" 'sort_by(.id | tonumber) | {tickets: ., held: $held}'
