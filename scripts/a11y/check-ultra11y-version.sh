#!/usr/bin/env bash
# LA VERSION D'ULTRA11Y VIT À TROIS ENDROITS DANS CE DÉPÔT, ET ILS DOIVENT S'ACCORDER.
#
#   1 & 2. `.github/workflows/a11y.yaml` — `uses: maxgfr/ultra11y@<sha> # vX`, DEUX FOIS : la
#          gate PR et `a11y-pages`. Le moteur est embarqué dans l'Action, donc ce SHA EST le
#          moteur. C'est un SHA et non un tag depuis le 03/09/2026 : l'upstream a supprimé la
#          totalité de ses tags git ce jour-là et `@v5.42.1` a cessé de résoudre, faisant
#          tomber la gate bloquante sur toutes les PR ouvertes. Le SHA est immuable ; le
#          commentaire `# vX` à côté est ce qui reste comparable à la devDependency, donc il
#          est load-bearing et pas décoratif — c'est lui que ce script lit.
#   3.     `packages/app/package.json` — la devDependency `ultra11y`. Ce n'est pas un doublon
#          décoratif : c'est le binaire (`pnpm exec ultra11y`) et le plugin Playwright
#          (`ultra11y/playwright`) dont `src/e2e/a11y/` se sert pour ÉCRIRE les instantanés que
#          l'Action réingère ensuite avec SON moteur.
#
# Deux versions, deux formats d'instantané — et la divergence ne lève aucune erreur : elle se
# lit comme des critères « à évaluer » dans un rapport qui a l'air complet.
#
# Dependabot met bien les trois à jour, mais dans des PR séparées et sur deux écosystèmes
# (`github-actions` et `npm`) : il n'a aucun moyen de savoir qu'elles vont ensemble. Ce script
# est ce qui refuse une demi-montée de version.
#
# Sortie 0 si tout s'accorde, 1 sinon. Aucune dépendance : grep et sed.
set -euo pipefail

root="${1:-$(git rev-parse --show-toplevel)}"
workflow="$root/.github/workflows/a11y.yaml"
manifest="$root/packages/app/package.json"

fail() {
  echo "✗ ultra11y : $1" >&2
  exit 1
}

[ -f "$workflow" ] || fail "fichier introuvable : $workflow"
[ -f "$manifest" ] || fail "fichier introuvable : $manifest"

# Les lignes `uses:` seulement — jamais un `maxgfr/ultra11y@<sha>` cité dans un commentaire,
# et il y en a un dans ce fichier.
# `|| true` : sans lui, `set -e` tuerait le script sur zéro correspondance AVANT le message
# du contrôle de `count`, et c'est le cas qu'on veut le plus voir expliqué — celui de
# quelqu'un qui remet un pin par tag.
uses=$(grep -oE '^[[:space:]]*uses:[[:space:]]*maxgfr/ultra11y@[0-9a-f]{40}[[:space:]]*#[[:space:]]*v[0-9]+\.[0-9]+\.[0-9]+' "$workflow" || true)
count=$(printf '%s\n' "$uses" | grep -c . || true)

# Un SHA de 40 caractères, puis la version que porte son commentaire.
shas=$(printf '%s\n' "$uses" | sed -E 's/.*@([0-9a-f]{40}).*/\1/')
pins=$(printf '%s\n' "$uses" | sed -E 's/.*#[[:space:]]*v//')
first_sha=$(printf '%s\n' "$shas" | sed -n 1p)
second_sha=$(printf '%s\n' "$shas" | sed -n 2p)
first=$(printf '%s\n' "$pins" | sed -n 1p)
second=$(printf '%s\n' "$pins" | sed -n 2p)
dep=$(grep -oE '"ultra11y"[[:space:]]*:[[:space:]]*"[0-9]+\.[0-9]+\.[0-9]+"' "$manifest" | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)"$/\1/')

[ "$count" -eq 2 ] || fail "attendu 2 \`uses: maxgfr/ultra11y@<sha 40 car.> # vX.Y.Z\` dans a11y.yaml, trouvé $count. Un pin par tag (\`@vX.Y.Z\`) ne compte pas : l'upstream a supprimé ses tags le 03/09/2026, ils ne résolvent plus. Si un tier a été ajouté ou retiré, mets ce script à jour avec lui."
[ -n "$dep" ] || fail "devDependency \`ultra11y\` introuvable dans packages/app/package.json"

[ "$first_sha" = "$second_sha" ] ||
  fail "les deux tiers de l'Action divergent — un job sur $first_sha, l'autre sur $second_sha. Ils doivent porter le même SHA."

[ "$first" = "$second" ] ||
  fail "les deux tiers de l'Action portent le même SHA mais l'annotent différemment — v$first d'un côté, v$second de l'autre. L'un des deux commentaires ment."

[ "$first" = "$dep" ] ||
  fail "l'Action est en v$first et la devDependency en $dep. Le balayage Playwright écrit les instantanés avec la devDependency et l'Action les réingère avec le sien — alignez-les."

echo "✓ ultra11y v$first (${first_sha:0:8}) : les deux tiers de l'Action et la devDependency sont alignés."
