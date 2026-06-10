#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# sprint_velocity.sh [<sprint_title>]
#
# Computes sprint velocity on the EGAPRO V2 project board, to help decide how
# much to commit to the next sprint.
#
# Definitions (cf. .claude/rules/complexity-estimation.md):
#   - LEAF tickets only      : items whose issue type is Task or Bug (the epic
#                              Feature is excluded — its load is its children's).
#   - Velocity of sprint N    : Σ Estimate of leaf items with Sprint==N whose
#                              Status ∈ {Done, In review} (In review counts —
#                              the AI finished, PR is up).
#   - Committed of sprint N   : Σ Estimate of ALL leaf items with Sprint==N.
#   - Carry-over              : committed − velocity (work not delivered).
#   - Recommendation          : rolling average velocity of the last 3
#                              COMPLETED sprints.
#
# Usage:
#   sprint_velocity.sh             # table of all sprints + recommendation
#   sprint_velocity.sh "Sprint 8"  # same + per-ticket breakdown of that sprint
#
# Pure bash + gh + jq. No LLM.
#
# Env:
#   EGAPRO_PROJECT_NUMBER  — project number (default: 164)
#   EGAPRO_ORG             — org login (default: SocialGouv)

set -euo pipefail

ORG="${EGAPRO_ORG:-SocialGouv}"
PROJECT_NUMBER="${EGAPRO_PROJECT_NUMBER:-164}"
FOCUS_SPRINT="${1:-}"

command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Sprint field configuration: which titles are completed vs current/future.
# ---------------------------------------------------------------------------
CONFIG=$(gh api graphql -f query='
query($org:String!, $num:Int!) {
  organization(login:$org) {
    projectV2(number:$num) {
      field(name: "Sprint") {
        ... on ProjectV2IterationField {
          configuration {
            iterations { title }
            completedIterations { title }
          }
        }
      }
    }
  }
}' -f org="$ORG" -F num="$PROJECT_NUMBER")

COMPLETED_TITLES=$(echo "$CONFIG" | jq -r '.data.organization.projectV2.field.configuration.completedIterations[].title')
CURRENT_TITLE=$(echo "$CONFIG" | jq -r '.data.organization.projectV2.field.configuration.iterations[0].title // empty')

# ---------------------------------------------------------------------------
# 2. Paginate all project items, flattening the fields we care about.
# ---------------------------------------------------------------------------
NODES_FILE=$(mktemp)
trap 'rm -f "$NODES_FILE"' EXIT
cursor=""

while :; do
  args=(-f query='
    query($org:String!, $num:Int!, $after:String) {
      organization(login:$org) {
        projectV2(number:$num) {
          items(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              content {
                __typename
                ... on Issue { number title issueType { name } }
              }
              fieldValues(first: 30) {
                nodes {
                  __typename
                  ... on ProjectV2ItemFieldNumberValue       { number field { ... on ProjectV2FieldCommon { name } } }
                  ... on ProjectV2ItemFieldSingleSelectValue  { name   field { ... on ProjectV2FieldCommon { name } } }
                  ... on ProjectV2ItemFieldIterationValue     { title  field { ... on ProjectV2FieldCommon { name } } }
                }
              }
            }
          }
        }
      }
    }' -f org="$ORG" -F num="$PROJECT_NUMBER")
  [ -n "$cursor" ] && args+=(-f after="$cursor")

  page=$(gh api graphql "${args[@]}")
  echo "$page" | jq '.data.organization.projectV2.items.nodes' >> "$NODES_FILE"

  hasNext=$(echo "$page" | jq -r '.data.organization.projectV2.items.pageInfo.hasNextPage')
  cursor=$(echo "$page" | jq -r '.data.organization.projectV2.items.pageInfo.endCursor')
  [ "$hasNext" = "true" ] || break
done

# Merge all page arrays, normalize each LEAF item to {sprint,status,est,number,title}.
ITEMS=$(jq -s 'add
  | map(select(.content.__typename == "Issue"))
  | map({
      number: .content.number,
      title:  .content.title,
      type:   (.content.issueType.name // "None"),
      sprint: ([ .fieldValues.nodes[] | select(.field.name == "Sprint")   | .title  ] | first // null),
      status: ([ .fieldValues.nodes[] | select(.field.name == "Status")   | .name   ] | first // "None"),
      est:    ([ .fieldValues.nodes[] | select(.field.name == "Estimate") | .number ] | first // 0)
    })
  | map(select(.type != "Feature"))' "$NODES_FILE")

# ---------------------------------------------------------------------------
# 3. Per-sprint aggregation.
# ---------------------------------------------------------------------------
DONE_FILTER='(.status == "Done" or .status == "In review")'

AGG=$(echo "$ITEMS" | jq --argjson done_set '["Done","In review"]' '
  map(select(.sprint != null))
  | group_by(.sprint)
  | map({
      sprint:     .[0].sprint,
      committed:  (map(.est) | add // 0),
      velocity:   (map(select(.status as $s | $done_set | index($s)) | .est) | add // 0),
      items:      length,
      done_items: (map(select(.status as $s | $done_set | index($s))) | length),
      unsized:    (map(select(.est == 0)) | length)
    })
  | sort_by(.sprint | ltrimstr("Sprint ") | tonumber? // 0)')

# ---------------------------------------------------------------------------
# 4. Render table.
# ---------------------------------------------------------------------------
echo "═══════════════════════════════════════════════════════════════════════"
echo " VÉLOCITÉ — EGAPRO V2 (feuilles Task/Bug ; Done ∪ In review)"
echo "═══════════════════════════════════════════════════════════════════════"
printf "%-12s %9s %9s %7s %9s  %s\n" "Sprint" "Engagé" "Réalisé" "Compl." "Tickets" "État"
echo "───────────────────────────────────────────────────────────────────────"

COMPLETED_JSON=$(printf '%s\n' "$COMPLETED_TITLES" | jq -R . | jq -s .)

echo "$AGG" | jq -r --arg current "$CURRENT_TITLE" --argjson completed "$COMPLETED_JSON" '
  .[] | [
    .sprint,
    (.committed | tostring),
    (.velocity  | tostring),
    (if .committed > 0 then ((.velocity / .committed * 100) | round | tostring) + "%" else "—" end),
    ((.done_items|tostring) + "/" + (.items|tostring)),
    (if .sprint == $current then "🟡 en cours"
     elif (.sprint as $s | $completed | index($s)) then "✅ terminé"
     else "🔭 à venir" end),
    (if .unsized > 0 then "  ⚠ " + (.unsized|tostring) + " non sizé(s)" else "" end)
  ] | @tsv' \
| while IFS=$'\t' read -r s comm velo compl tick state warn; do
    printf "%-12s %9s %9s %7s %9s  %s%s\n" "$s" "$comm" "$velo" "$compl" "$tick" "$state" "$warn"
  done

echo "───────────────────────────────────────────────────────────────────────"

# ---------------------------------------------------------------------------
# 5. Recommendation: rolling average of last 3 COMPLETED sprints' velocity.
# ---------------------------------------------------------------------------
REC=$(echo "$AGG" | jq --argjson completed "$COMPLETED_JSON" '
  map(select(.sprint as $s | $completed | index($s)))
  | sort_by(.sprint | ltrimstr("Sprint ") | tonumber? // 0)
  | (.[-3:]) as $last3
  | {
      n:        ($last3 | length),
      sprints:  ($last3 | map(.sprint)),
      velocities: ($last3 | map(.velocity)),
      avg:      (if ($last3|length) > 0 then (($last3 | map(.velocity) | add) / ($last3 | length)) else 0 end)
    }')

N=$(echo "$REC" | jq -r '.n')
if [ "$N" -gt 0 ]; then
  SPRINTS=$(echo "$REC" | jq -r '.sprints | join(", ")')
  VELOS=$(echo "$REC" | jq -r '.velocities | join(", ")')
  AVG=$(echo "$REC" | jq -r '.avg | (. * 10 | round / 10)')
  AVG_FLOOR=$(echo "$REC" | jq -r '.avg | floor')
  echo
  echo " RECOMMANDATION PROCHAIN SPRINT"
  echo " ────────────────────────────"
  echo "   Moyenne glissante sur $N sprint(s) terminé(s) : $SPRINTS"
  echo "   Vélocités réalisées        : $VELOS"
  echo "   → Capacité conseillée      : ~$AVG pts (plancher prudent : $AVG_FLOOR pts)"
  echo
  echo "   Convention t-shirt : XS=1  S=2  M=3  L=5  XL=8"
else
  echo
  echo " Pas encore de sprint terminé avec des tickets sizés — reviens après le 1er sprint."
fi

# ---------------------------------------------------------------------------
# 6. Optional per-ticket breakdown for a focused sprint.
# ---------------------------------------------------------------------------
if [ -n "$FOCUS_SPRINT" ]; then
  echo
  echo "═══════════════════════════════════════════════════════════════════════"
  echo " DÉTAIL — $FOCUS_SPRINT"
  echo "═══════════════════════════════════════════════════════════════════════"
  echo "$ITEMS" | jq -r --arg sp "$FOCUS_SPRINT" '
    map(select(.sprint == $sp))
    | sort_by(.status, -.est)
    | .[] | [ ("#"+(.number|tostring)), (.est|tostring)+"pt", .status, (.title[0:60]) ] | @tsv' \
  | while IFS=$'\t' read -r num est status title; do
      printf "  %-7s %-5s %-12s %s\n" "$num" "$est" "$status" "$title"
    done
  FOUND=$(echo "$ITEMS" | jq --arg sp "$FOCUS_SPRINT" 'map(select(.sprint == $sp)) | length')
  [ "$FOUND" -eq 0 ] && echo "  (aucun ticket sur ce sprint — vérifie le titre exact)"
fi
