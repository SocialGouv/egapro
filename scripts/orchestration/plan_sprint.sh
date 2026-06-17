#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# plan_sprint.sh [--apply] [<target_sprint_title>]
#
# Plans the NEXT sprint on the EGAPRO V2 board:
#   1. Capacity   = rolling average velocity of the last 3 COMPLETED sprints
#                   (Σ Estimate of leaf Task/Bug delivered: Done ∪ In review).
#   2. Carry-over = leaf tickets of the CURRENT (ending) sprint not yet
#                   delivered (Status ∉ {Done, In review}) → moved to target.
#   3. Backlog fill = sized leaf tickets in {Backlog, To Do} with no sprint,
#                   sorted by Priority (P0→P1→P2) then SMALLEST points first
#                   (fills the remaining budget with the most tickets), added
#                   greedily WITHOUT ever exceeding capacity (carry counts first).
#
# Sprint creation is NOT automated: the GitHub API regenerates ALL iteration
# IDs when the iteration config is edited, which would orphan every existing
# Sprint assignment on the board. If the target sprint doesn't exist yet, this
# script HALTS (exit 4) and tells you to add the iteration via the UI (1 click).
#
# Modes:
#   plan_sprint.sh                 # PLAN only (read-only) — prints the proposed plan
#   plan_sprint.sh "Sprint 10"     # plan a specific target sprint
#   plan_sprint.sh --apply         # WRITE: assign the planned tickets to the target sprint
#   plan_sprint.sh --apply "Sprint 10"
#
# The /plan-sprint skill runs plan mode first, shows it, waits for explicit
# user validation, then runs --apply (selection is deterministic → plan == apply).
#
# Pure bash + gh + jq.
#
# Env:
#   EGAPRO_PROJECT_NUMBER  (default 164)   EGAPRO_ORG (default SocialGouv)
#   EGAPRO_PROJECT_ID      (default PVT_kwDOAh0HH84BFsK7)
#   EGAPRO_SPRINT_FIELD_ID (default PVTIF_lADOAh0HH84BFsK7zg8pCDM)

set -euo pipefail

ORG="${EGAPRO_ORG:-SocialGouv}"
PROJECT_NUMBER="${EGAPRO_PROJECT_NUMBER:-164}"
PROJECT_ID="${EGAPRO_PROJECT_ID:-PVT_kwDOAh0HH84BFsK7}"
SPRINT_FIELD_ID="${EGAPRO_SPRINT_FIELD_ID:-PVTIF_lADOAh0HH84BFsK7zg8pCDM}"

APPLY=0
TARGET_TITLE=""
for a in "$@"; do
  case "$a" in
    --apply) APPLY=1 ;;
    *) TARGET_TITLE="$a" ;;
  esac
done

command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }
TODAY="$(date +%F)"

# ---------------------------------------------------------------------------
# 1. Sprint field config → current (ending) sprint + target (next) sprint.
# ---------------------------------------------------------------------------
CONFIG=$(gh api graphql -f query='
query($org:String!, $num:Int!) {
  organization(login:$org) { projectV2(number:$num) {
    field(name:"Sprint") { ... on ProjectV2IterationField {
      configuration {
        iterations          { id title startDate duration }
        completedIterations { id title startDate }
      }
    } }
  } }
}' -f org="$ORG" -F num="$PROJECT_NUMBER" --jq '.data.organization.projectV2.field.configuration')

COMPLETED_JSON=$(echo "$CONFIG" | jq '[.completedIterations[].title]')

# current = latest active iteration that has already started (startDate <= today)
CURRENT=$(echo "$CONFIG" | jq -c --arg today "$TODAY" '
  [.iterations[] | select(.startDate <= $today)] | sort_by(.startDate) | last // null')
CURRENT_TITLE=$(echo "$CURRENT" | jq -r '.title // empty')
CURRENT_START=$(echo "$CURRENT" | jq -r '.startDate // "0000-00-00"')

# target = explicit arg, else first active iteration starting after current
if [ -n "$TARGET_TITLE" ]; then
  TARGET=$(echo "$CONFIG" | jq -c --arg t "$TARGET_TITLE" '[.iterations[] | select(.title == $t)] | first // null')
else
  TARGET=$(echo "$CONFIG" | jq -c --arg cs "$CURRENT_START" '
    [.iterations[] | select(.startDate > $cs)] | sort_by(.startDate) | first // null')
fi

if [ "$TARGET" = "null" ] || [ -z "$TARGET" ]; then
  echo "✋ Aucun sprint cible disponible." >&2
  echo "" >&2
  echo "Le sprint suivant n'existe pas encore et l'API GitHub ne peut pas le créer" >&2
  echo "sans casser les assignations existantes du board." >&2
  echo "" >&2
  echo "→ Ajoute-le en 1 clic dans l'UI :" >&2
  echo "  Project EGAPRO V2 → ⚙ Settings → champ « Sprint » → « Add iteration »" >&2
  echo "  (GitHub remplit automatiquement les dates depuis la durée de 14 jours)" >&2
  echo "  puis relance /plan-sprint." >&2
  exit 4
fi
TARGET_TITLE=$(echo "$TARGET" | jq -r '.title')
TARGET_ID=$(echo "$TARGET" | jq -r '.id')

# ---------------------------------------------------------------------------
# 2. Fetch all project items (with item id, for assignment).
# ---------------------------------------------------------------------------
NODES_FILE=$(mktemp); trap 'rm -f "$NODES_FILE"' EXIT
cursor=""
while :; do
  args=(-f query='
    query($org:String!, $num:Int!, $after:String) {
      organization(login:$org) { projectV2(number:$num) {
        items(first:100, after:$after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            content { __typename ... on Issue { number title issueType { name } } }
            fieldValues(first:30) { nodes {
              __typename
              ... on ProjectV2ItemFieldNumberValue      { number field { ... on ProjectV2FieldCommon { name } } }
              ... on ProjectV2ItemFieldSingleSelectValue { name   field { ... on ProjectV2FieldCommon { name } } }
              ... on ProjectV2ItemFieldIterationValue    { title  field { ... on ProjectV2FieldCommon { name } } }
            } }
          }
        }
      } }
    }' -f org="$ORG" -F num="$PROJECT_NUMBER")
  [ -n "$cursor" ] && args+=(-f after="$cursor")
  page=$(gh api graphql "${args[@]}")
  echo "$page" | jq '.data.organization.projectV2.items.nodes' >> "$NODES_FILE"
  [ "$(echo "$page" | jq -r '.data.organization.projectV2.items.pageInfo.hasNextPage')" = "true" ] || break
  cursor=$(echo "$page" | jq -r '.data.organization.projectV2.items.pageInfo.endCursor')
done

ITEMS=$(jq -s 'add
  | map(select(.content.__typename == "Issue"))
  | map({
      item_id: .id,
      number:  .content.number,
      title:   .content.title,
      type:    (.content.issueType.name // "None"),
      status:  ([ .fieldValues.nodes[] | select(.field.name=="Status")   | .name   ] | first // "None"),
      est:     ([ .fieldValues.nodes[] | select(.field.name=="Estimate") | .number ] | first // 0),
      priority:([ .fieldValues.nodes[] | select(.field.name=="Priority") | .name   ] | first // "—"),
      sprint:  ([ .fieldValues.nodes[] | select(.field.name=="Sprint")   | .title  ] | first // null)
    })
  | map(select(.type == "Task" or .type == "Bug"))' "$NODES_FILE")

# ---------------------------------------------------------------------------
# 3. Compute capacity, carry-over, backlog fill — all in one jq pass.
# ---------------------------------------------------------------------------
CAP=$(jq -n --argjson items "$ITEMS" --argjson completed "$COMPLETED_JSON" '
  ["Done","In review"] as $done
  | [ $items[] | select(.sprint != null) ]
  | group_by(.sprint)
  | map({ sprint: .[0].sprint,
          velocity: (map(select(.status as $s | $done | index($s)) | .est) | add // 0) })
  | map(select(.sprint as $s | $completed | index($s)))
  | sort_by(.sprint | ltrimstr("Sprint ") | tonumber? // 0)
  | (.[-3:]) as $l
  | if ($l|length) > 0 then (($l | map(.velocity) | add) / ($l|length)) else 0 end
  | (. + 0.5 | floor)')   # round to nearest integer

PLAN=$(jq -cn \
  --argjson items "$ITEMS" --arg current "$CURRENT_TITLE" --argjson cap "$CAP" '
  ["Done","In review"] as $done
  | {"P0":0,"P1":1,"P2":2} as $prio
  # carry-over: current sprint, not delivered
  | ([ $items[] | select(.sprint == $current and (.status as $s | $done | index($s) | not)) ]) as $carry
  | ($carry | map(.est) | add // 0) as $carry_pts
  # backlog candidates: no sprint, ready, sized; sort priority then smallest first
  | ([ $items[]
       | select(.sprint == null and (.status == "Backlog" or .status == "To Do") and .est > 0) ]
     | sort_by([ ($prio[.priority] // 3), .est, .number ])) as $cand
  # greedy fill, never exceeding cap (carry counts first)
  | (reduce $cand[] as $c ({running: $carry_pts, picks: []};
        if (.running + $c.est) <= $cap
        then {running: (.running + $c.est), picks: (.picks + [$c])}
        else . end)) as $fill
  | { cap: $cap,
      carry: $carry, carry_pts: $carry_pts,
      picks: $fill.picks, picks_pts: ($fill.picks | map(.est) | add // 0),
      total: $fill.running,
      leftover: ($cap - $fill.running),
      candidates_total: ($cand | length),
      candidates_left: (($cand | length) - ($fill.picks | length)) }')

# ---------------------------------------------------------------------------
# 4. Render the plan.
# ---------------------------------------------------------------------------
echo "═══════════════════════════════════════════════════════════════════════"
echo " PLAN DE SPRINT → $TARGET_TITLE"
echo "═══════════════════════════════════════════════════════════════════════"
echo " Sprint courant (en cours/terminé) : ${CURRENT_TITLE:-<aucun>}"
echo " Capacité cible (moy. glissante 3 sprints) : $(echo "$PLAN" | jq -r '.cap') pts"
echo "───────────────────────────────────────────────────────────────────────"

echo " ↪ REPORTÉS du sprint courant (non livrés) :"
CARRY_N=$(echo "$PLAN" | jq -r '.carry | length')
if [ "$CARRY_N" -eq 0 ]; then
  echo "     (aucun — rien à reporter)"
else
  echo "$PLAN" | jq -r '.carry[] | "     #\(.number)  \(if .est>0 then (.est|tostring)+"pt" else "0pt⚠" end)  [\(.priority)]  \(.status)  \(.title[0:50])"'
fi
echo "     → sous-total reporté : $(echo "$PLAN" | jq -r '.carry_pts') pts"
echo

echo " ➕ AJOUTÉS depuis le backlog (priorité → petits d'abord) :"
PICK_N=$(echo "$PLAN" | jq -r '.picks | length')
if [ "$PICK_N" -eq 0 ]; then
  echo "     (aucun — capacité déjà consommée par les reports)"
else
  echo "$PLAN" | jq -r '.picks[] | "     #\(.number)  \(.est)pt  [\(.priority)]  \(.status)  \(.title[0:50])"'
fi
echo "     → sous-total ajouté : $(echo "$PLAN" | jq -r '.picks_pts') pts"
echo "───────────────────────────────────────────────────────────────────────"
echo " TOTAL ENGAGÉ : $(echo "$PLAN" | jq -r '.total') / $(echo "$PLAN" | jq -r '.cap') pts   (marge : $(echo "$PLAN" | jq -r '.leftover') pts)"
LEFT=$(echo "$PLAN" | jq -r '.candidates_left')
[ "$LEFT" -gt 0 ] && echo " Backlog restant éligible non embarqué : $LEFT ticket(s)"
echo "═══════════════════════════════════════════════════════════════════════"

# ---------------------------------------------------------------------------
# 5. Apply (write) — assign every carry + pick to the target sprint.
# ---------------------------------------------------------------------------
if [ "$APPLY" -eq 1 ]; then
  echo
  echo "✍ Application : assignation au sprint « $TARGET_TITLE »…"
  ITEM_IDS=$(echo "$PLAN" | jq -r '(.carry + .picks)[].item_id')
  COUNT=0
  while IFS= read -r ITEM; do
    [ -z "$ITEM" ] && continue
    gh api graphql -f query='
      mutation($p:ID!, $i:ID!, $f:ID!, $it:String!) {
        updateProjectV2ItemFieldValue(input:{
          projectId:$p, itemId:$i, fieldId:$f, value:{ iterationId:$it }
        }) { projectV2Item { id } }
      }' -f p="$PROJECT_ID" -f i="$ITEM" -f f="$SPRINT_FIELD_ID" -f it="$TARGET_ID" >/dev/null
    COUNT=$((COUNT+1))
  done <<< "$ITEM_IDS"
  echo "✓ $COUNT ticket(s) assigné(s) à « $TARGET_TITLE »."
else
  echo
  echo "ℹ Mode PLAN (lecture seule) — aucune écriture. Pour appliquer :"
  echo "    bash scripts/orchestration/plan_sprint.sh --apply \"$TARGET_TITLE\""
fi
