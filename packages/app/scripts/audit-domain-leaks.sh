#!/usr/bin/env bash
#
# audit-domain-leaks.sh — repo-wide sweep for business rules leaked outside the
# domain layer (`src/modules/domain`).
#
# WHY this exists: the `block-bad-patterns` hook and the `structural-auditor`
# agent only see the CHANGED files of the current ticket. A business rule can
# sit re-implemented inline in a file that the ticket never touches — invisible
# to both. This script applies every detection signature to the WHOLE tree, so a
# broad audit catches those latent leaks. Run it manually or from CI.
#
# Usage:  bash packages/app/scripts/audit-domain-leaks.sh
# Exit:   0 = no ERROR-level leak, 1 = at least one ERROR-level leak found.
#         WARN-level hits are printed but do not fail the run.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/src"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "ERROR: src dir not found at $SRC_DIR" >&2
  exit 2
fi

# Files that legitimately hold the rules (the single source of truth) or exercise
# them — never flagged.
EXCLUDE='domain/|__tests__|\.test\.|\.spec\.|/e2e/|\.e2e\.'

error_count=0
warn_count=0

# scan <SEVERITY> <label> <extended-regex>
scan() {
  local severity="$1" label="$2" pattern="$3"
  local hits
  hits="$(grep -rnE "$pattern" "$SRC_DIR" --include='*.ts' --include='*.tsx' 2>/dev/null \
    | grep -vE "$EXCLUDE")"
  if [[ -n "$hits" ]]; then
    local n
    n="$(printf '%s\n' "$hits" | wc -l | tr -d ' ')"
    echo ""
    echo "[$severity] $label  ($n)"
    printf '%s\n' "$hits" | sed 's#^#  #'
    if [[ "$severity" == "ERROR" ]]; then
      error_count=$((error_count + n))
    else
      warn_count=$((warn_count + n))
    fi
  fi
}

echo "=== Domain-leak audit — $SRC_DIR (excluding domain/, tests, e2e) ==="

# --- ERROR: high-confidence leaks with a clear domain home ---------------------
scan ERROR "Inline gap threshold — use gapLevel(gap) === \"high\"" \
  '(>=|<)[[:space:]]*GAP_ALERT_THRESHOLD'
scan ERROR "Inline signed-gap formula — use computeGap()/computeGapBetween()" \
  '\([[:space:]]*[a-zA-Z_.]*[mM]en[a-zA-Z_.]*[[:space:]]*-[[:space:]]*[a-zA-Z_.]*[wW]omen'
scan ERROR "Inline cancelledAt !== null — use isCancelled()" \
  'cancelledAt[[:space:]]*!==?[[:space:]]*null'
scan ERROR "Inline getFullYear() — use getCurrentYear()/getWorkforceYear()" \
  'getFullYear\(\)'
# Catches both the literal slice(0, 9) and the SIREN_LENGTH-const evasion.
scan ERROR "Inline SIREN slice — use extractSiren()/parseSiren()" \
  '(slice|substring|substr)\(0,[[:space:]]*(9|[A-Za-z_]*SIREN[A-Za-z_]*|[A-Za-z_]*[Ss]iren[A-Za-z_]*)\)|SIREN_LENGTH[[:space:]]*=[[:space:]]*9'
scan ERROR "Inline date arithmetic — use campaign date helpers" \
  '\.(getMonth|getDate)\(\)'
scan ERROR "Hardcoded first-declaration year — use FIRST_DECLARATION_YEAR" \
  '(year|annee)[a-zA-Z]*[[:space:]]*(<|>=)[[:space:]]*2018|\.min\(2018\)'

# --- WARN: probable leaks that need a judgment call or a NEW domain helper ------
# Includes === and !== forms (status !== "draft" is the isDeclarationSubmitted duplicate).
scan WARN "Status-string decision — centralize as a domain predicate (isDraft/isCancelled/isDeclarationSubmitted)" \
  'status[[:space:]]*(===|!==)[[:space:]]*"(draft|submitted|validated|cancelled|demarche_completed)"'
scan WARN "GAP_ALERT_THRESHOLD used in arithmetic — derive the band/ratio in domain" \
  '[-+*/][[:space:]]*GAP_ALERT_THRESHOLD|GAP_ALERT_THRESHOLD[[:space:]]*[-+*/]'
scan WARN "Direction determination (women vs men) — belongs in gap.ts" \
  '[wW]omen[a-zA-Z]*[[:space:]]*(<|>|<=|>=)[[:space:]]*[a-zA-Z_.]*[mM]en|[mM]en[a-zA-Z]*[[:space:]]*(<|>|<=|>=)[[:space:]]*[a-zA-Z_.]*[wW]omen'
scan WARN "Ratio→percentage on a gap column — extract a named domain helper" \
  'Number\([a-zA-Z_.]*[gG]ap[a-zA-Z_.]*\)[[:space:]]*\*[[:space:]]*100'
scan WARN "Reference/data year (year - 1) — candidate for a getReferenceYear(year) helper" \
  '\.year[[:space:]]*-[[:space:]]*1'
scan WARN "toLocaleString(\"fr-FR\") — probable duplicate of formatCount/formatRate/formatCurrency" \
  'toLocaleString.*fr-FR|toLocaleString.*"fr"'

echo ""
echo "=== Summary: $error_count ERROR-level, $warn_count WARN-level ==="
if [[ "$error_count" -gt 0 ]]; then
  echo "FAIL — resolve ERROR-level leaks (move the rule into ~/modules/domain and import it)."
  exit 1
fi
echo "OK — no ERROR-level domain leaks."
exit 0
