#!/usr/bin/env bash
# Hook: UserPromptSubmit
#
# LE QUATRIÈME ENDROIT OÙ VIT LA VERSION D'ULTRA11Y, ET LE SEUL QUE LA CI NE VOIT PAS.
#
# `ci.yaml` tient ensemble les trois versions DU DÉPÔT (les deux `uses:` de l'Action et la
# devDependency) via scripts/a11y/check-ultra11y-version.sh. Le plugin Claude Code, lui, est
# installé sur TA MACHINE : `.claude/settings.json` déclare `"ultra11y@ultra11y": true` sans
# version, donc l'install prend ce que la marketplace avait ce jour-là — et n'en bouge plus
# jamais toute seule.
#
# Ce n'est pas théorique : mesuré le 31/08/2026, le plugin installé était en **4.5.1** pendant
# que le dépôt tournait en 5.40.1. L'agent `rgaa-auditor`, qui EST la gate d'accessibilité des
# sessions locales, auditait donc avec un moteur d'une trentaine de versions mineures en
# arrière — sans tout le contrat d'automatisation 5.36, sans les correctifs de citation
# 5.22–5.24. Un audit qui répond, avec assurance, à une autre question.
#
# Ce que fait ce hook : une comparaison LOCALE (un fichier JSON, un grep — aucun réseau), et
# seulement en cas d'écart, la mise à jour. L'écart est rare : le coût réseau est payé une fois
# par release, jamais à chaque prompt.
#
# Silencieux quand tout va bien, et silencieux quand il ne peut pas conclure : un poste sans
# `claude` sur le PATH, sans plugin installé ou hors ligne n'a pas à voir passer un avertissement
# qu'il ne peut pas traiter.

set -euo pipefail

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || echo "")}"
[ -n "$REPO_ROOT" ] || exit 0

WORKFLOW="$REPO_ROOT/.github/workflows/a11y.yaml"
INSTALLED="$HOME/.claude/plugins/installed_plugins.json"
[ -f "$WORKFLOW" ] || exit 0
[ -f "$INSTALLED" ] || exit 0

# Une fois par session. Même mécanique que check-pr-reviews.sh : le PPID est stable dans une
# session Claude Code.
MARKER="/tmp/.claude-ultra11y-plugin-$PPID"
[ -f "$MARKER" ] && exit 0
touch "$MARKER"

# LA RÉFÉRENCE EST LE TAG DE L'ACTION, pas la devDependency : c'est le moteur, et la CI garantit
# déjà que les trois versions du dépôt s'accordent. Une seule source à lire, donc.
WANT=$(grep -E '^[[:space:]]*uses:[[:space:]]*maxgfr/ultra11y@' "$WORKFLOW" | sed -E '
	s/.*@v([0-9]+\.[0-9]+\.[0-9]+).*/\1/
	t
	s/.*#[[:space:]]*v([0-9]+\.[0-9]+\.[0-9]+).*/\1/
	t
	s/.*//
' | grep -m1 . || true)
[ -n "$WANT" ] || exit 0

# La plus haute version installée, tous scopes confondus : le plugin peut être posé au scope
# projet sur un chemin de worktree éphémère, et on ne veut pas crier pour une entrée orpheline.
installed_version() {
  python3 -c '
import json, sys
try:
    entries = json.load(open(sys.argv[1]))["plugins"].get("ultra11y@ultra11y", [])
except Exception:
    sys.exit(0)
best = ""
for e in entries:
    v = e.get("version") or ""
    try:
        parsed = [int(x) for x in v.split(".")]
    except ValueError:
        continue
    if not best or parsed > [int(x) for x in best.split(".")]:
        best = v
print(best)
' "$INSTALLED" 2>/dev/null || true
}

HAVE=$(installed_version)

# Pas de plugin installé : ce n'est pas une dérive, c'est un choix (ou une machine neuve).
# `.claude/rules/rgaa.md` dit déjà comment l'installer ; ce hook ne double pas ce message.
[ -n "$HAVE" ] || exit 0
[ "$HAVE" = "$WANT" ] && exit 0

command -v claude >/dev/null 2>&1 || {
  echo "⚠️  Plugin ultra11y en $HAVE, le dépôt tourne en $WANT — mets-le à jour avec \`claude plugin update ultra11y\`."
  exit 0
}

echo "⚠️  Plugin ultra11y local en **$HAVE**, dépôt en **$WANT** — le skill review-a11y (agent rgaa-auditor) audite avec un moteur périmé. Mise à jour en cours…"

# Bornés : un miroir GitHub lent ne doit pas retenir un prompt. Un échec n'est pas fatal — on
# dit quoi taper et on rend la main.
MANUAL='`claude plugin marketplace update ultra11y && claude plugin update ultra11y --scope project`'

if ! timeout 60 claude plugin marketplace update ultra11y >/dev/null 2>&1 ||
  ! timeout 60 claude plugin update ultra11y --scope project >/dev/null 2>&1; then
  echo "⚠️  Mise à jour automatique impossible (réseau ?). À faire à la main : $MANUAL"
  exit 0
fi

# ON RELIT PLUTÔT QU'ON N'ANNONCE. `claude plugin update` monte vers le DERNIER tag publié sur
# la marketplace, pas vers `$WANT` : si le dépôt épingle une version que la marketplace n'a pas
# encore (ou plus), la commande sort 0 sans avoir rejoint la cible. Annoncer « mis à jour en
# $WANT » sur ce seul code de retour, c'est réintroduire exactement le silence que ce hook
# existe pour rompre.
NOW=$(installed_version)
if [ "$NOW" = "$WANT" ]; then
  echo "✅ Plugin ultra11y mis à jour en $NOW. **Redémarre Claude Code** pour l'appliquer."
elif [ -n "$NOW" ] && [ "$NOW" != "$HAVE" ]; then
  echo "⚠️  Plugin passé de $HAVE à $NOW, mais le dépôt épingle $WANT — la marketplace n'expose pas encore ce tag. **Redémarre Claude Code**, et vérifie le pin de \`.github/workflows/a11y.yaml\`."
else
  echo "⚠️  Le plugin est resté en $NOW alors que le dépôt épingle $WANT. À reprendre à la main : $MANUAL"
fi

exit 0
