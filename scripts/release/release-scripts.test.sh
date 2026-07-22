#!/usr/bin/env bash
# Tests for the release changelog scripts:
#   - collect_release_issues.sh  (epic rollup, technical filter, PR fallback, dedup)
#   - publish_release_summary.sh (append, idempotent replace, whitespace no-op)
#
# No network: `gh` is stubbed on PATH, and collect runs against a throwaway git
# repo with crafted commits/tags. Run: bash scripts/release/release-scripts.test.sh
# Requires: bash 4+, git, jq.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COLLECT="$SCRIPT_DIR/collect_release_issues.sh"
PUBLISH="$SCRIPT_DIR/publish_release_summary.sh"

PASS=0
FAIL=0
pass() { echo "  ✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }
assert_eq() { # <desc> <expected> <actual>
    if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 (attendu '$2', obtenu '$3')"; fi
}

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# ---------- gh stub ----------
STUB_DIR="$WORK/bin"
FIX="$WORK/fixtures"
mkdir -p "$STUB_DIR" "$FIX"
cat >"$STUB_DIR/gh" <<'STUB'
#!/usr/bin/env bash
# Minimal gh stub for the release scripts.
kind="$1 $2"
num="$3"
case "$kind" in
    "pr view")      cat "$GH_FIX/pr-$num.json" ;;
    "issue view")   cat "$GH_FIX/issue-$num.json" ;;
    "release view") cat "$GH_REL_BODY" ;;
    "release edit")
        while [ $# -gt 0 ]; do
            if [ "$1" = "--notes-file" ]; then cp "$2" "$GH_REL_EDITED"; break; fi
            shift
        done
        ;;
    *) echo "gh stub: unhandled: $*" >&2; exit 1 ;;
esac
STUB
chmod +x "$STUB_DIR/gh"
export PATH="$STUB_DIR:$PATH"
export GH_FIX="$FIX"

# ============================================================
echo "== collect_release_issues.sh =="
# ============================================================
REPO_DIR="$WORK/repo"
mkdir -p "$REPO_DIR"
git -C "$REPO_DIR" init -q
git -C "$REPO_DIR" config user.email t@t.t
git -C "$REPO_DIR" config user.name t
# Keep commits/tags unsigned & lightweight regardless of the host's global git
# config (a global tag.gpgsign=true would otherwise abort `git tag` with
# "no tag message?").
git -C "$REPO_DIR" config commit.gpgsign false
git -C "$REPO_DIR" config tag.gpgsign false
git -C "$REPO_DIR" config tag.forceSignAnnotated false
c() { git -C "$REPO_DIR" commit -q --allow-empty -m "$1"; }
c "chore: init"
git -C "$REPO_DIR" tag v0
c "feat: nouvelle fonctionnalité métier (#101)"
c "chore(deps): bump lodash (#102)"
c "feat(epic): #200 — Grande feature utilisateur (#103)"
c "fix: correction du parcours (#104)"
git -C "$REPO_DIR" tag v1

printf '%s\n' '{"title":"feat: nouvelle fonctionnalité métier","labels":[],"closingIssuesReferences":[]}' >"$FIX/pr-101.json"
printf '%s\n' '{"title":"chore(deps): bump lodash","labels":[{"name":"dependencies"}],"closingIssuesReferences":[]}' >"$FIX/pr-102.json"
printf '%s\n' '{"title":"feat(epic): #200 — Grande feature utilisateur","labels":[],"closingIssuesReferences":[{"number":201},{"number":202}]}' >"$FIX/pr-103.json"
printf '%s\n' '{"title":"fix: correction du parcours","labels":[],"closingIssuesReferences":[{"number":300}]}' >"$FIX/pr-104.json"
printf '%s\n' '{"title":"Grande feature utilisateur","labels":[{"name":"Epic"}]}' >"$FIX/issue-200.json"
printf '%s\n' '{"title":"Un besoin métier concret","labels":[{"name":"cat: autre"}]}' >"$FIX/issue-300.json"

OUT=$(cd "$REPO_DIR" && GITHUB_REPOSITORY="test/test" bash "$COLLECT" v1 2>/dev/null)

assert_eq "3 entrées au total (fallback PR + rollup epic + issue)" "3" "$(jq 'length' <<<"$OUT")"
assert_eq "epic #200 présent (rollup)" "1" "$(jq '[.[]|select(.issue==200)]|length' <<<"$OUT")"
assert_eq "sous-tickets 201/202 NON explosés" "0" "$(jq '[.[]|select(.issue==201 or .issue==202)]|length' <<<"$OUT")"
assert_eq "PR technique #102 (dependencies) filtrée" "0" "$(jq '[.[]|select(.pr==102)]|length' <<<"$OUT")"
assert_eq "PR #101 sans issue liée → entrée fallback (issue null)" "1" "$(jq '[.[]|select(.pr==101 and .issue==null)]|length' <<<"$OUT")"
assert_eq "issue #300 résolue via la fix PR #104" "1" "$(jq '[.[]|select(.issue==300)]|length' <<<"$OUT")"

# ============================================================
echo "== publish_release_summary.sh =="
# ============================================================
export GH_REL_BODY="$WORK/relbody.txt"
export GH_REL_EDITED="$WORK/reledited.txt"
TAG="v1.2.3-alpha.1"

# 1) Append into a body without any existing marker.
printf 'Notes de version initiales.\n' >"$GH_REL_BODY"
: >"$GH_REL_EDITED"
printf -- '- Point métier A\n- Point métier B\n' >"$WORK/summary.md"
GITHUB_REPOSITORY="test/test" bash "$PUBLISH" "$TAG" "$WORK/summary.md" >/dev/null 2>&1
assert_eq "append: 1 seul marqueur de début" "1" "$(grep -cF '<!-- ai-changelog -->' "$GH_REL_EDITED")"
assert_eq "append: version dans le titre de section" "1" "$(grep -cF "$TAG — Résumé" "$GH_REL_EDITED")"
if grep -qF "Point métier A" "$GH_REL_EDITED" && grep -qF "Notes de version initiales" "$GH_REL_EDITED"; then
    pass "append: body original + résumé tous deux présents"
else
    fail "append: contenu manquant"
fi

# 2) Idempotent replace: feed the edited body back as the current release body.
cp "$GH_REL_EDITED" "$GH_REL_BODY"
: >"$GH_REL_EDITED"
printf -- '- Nouveau point métier unique\n' >"$WORK/summary.md"
GITHUB_REPOSITORY="test/test" bash "$PUBLISH" "$TAG" "$WORK/summary.md" >/dev/null 2>&1
assert_eq "replace: toujours 1 seul marqueur (pas de duplication)" "1" "$(grep -cF '<!-- ai-changelog -->' "$GH_REL_EDITED")"
assert_eq "replace: ancien contenu supprimé" "0" "$(grep -cF 'Point métier A' "$GH_REL_EDITED")"
assert_eq "replace: nouveau contenu présent" "1" "$(grep -cF 'Nouveau point métier unique' "$GH_REL_EDITED")"

# 3) Whitespace-only summary → no-op (gh release edit must NOT be called).
: >"$GH_REL_EDITED"
printf '   \n\t\n' >"$WORK/summary.md"
GITHUB_REPOSITORY="test/test" bash "$PUBLISH" "$TAG" "$WORK/summary.md" >/dev/null 2>&1
if [ -s "$GH_REL_EDITED" ]; then
    fail "whitespace-only: la release ne devrait PAS être éditée"
else
    pass "whitespace-only: no-op (aucune édition de release)"
fi

# ============================================================
echo ""
echo "Résultat : ${PASS} ✅  /  ${FAIL} ❌"
[ "$FAIL" -eq 0 ]
