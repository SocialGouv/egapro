#!/usr/bin/env bash
# LA VERSION D'ULTRA11Y VIT À TROIS ENDROITS DANS CE DÉPÔT, ET ILS DOIVENT S'ACCORDER.
#
#   1 & 2. `.github/workflows/a11y.yaml` — `uses: maxgfr/ultra11y@…`, DEUX FOIS : la gate PR
#          et `a11y-pages`. Le moteur est embarqué dans l'Action. La version se lit soit
#          sur `@vX.Y.Z`, soit sur un `# vX.Y.Z` quand le ref est un SHA de release
#          (les tags peuvent disparaître en amont alors que le commit reste).
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
# Sortie 0 si tout s'accorde, 1 sinon. grep/sed en local ; curl pour résoudre un SHA vers
# la version publiée dans package.json amont (repli sur le commentaire si hors ligne).
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

# Lignes `uses:` seulement — un SHA cité dans un commentaire du workflow ne compte pas.
uses_lines=$(grep -E '^[[:space:]]*uses:[[:space:]]*maxgfr/ultra11y@' "$workflow" || true)
count=$(printf '%s\n' "$uses_lines" | grep -c . || true)

pin_version() {
	printf '%s\n' "$1" | sed -E '
		s/.*@v([0-9]+\.[0-9]+\.[0-9]+).*/\1/
		t
		s/.*#[[:space:]]*v([0-9]+\.[0-9]+\.[0-9]+).*/\1/
		t
		s/.*//
	'
}

pin_ref() {
	printf '%s\n' "$1" | sed -E 's|^[[:space:]]*uses:[[:space:]]*maxgfr/ultra11y@([^[:space:]#]+).*|\1|'
}

resolve_engine_version() {
	local ref="$1"
	command -v curl >/dev/null 2>&1 || return 1
	local json
	json=$(curl -sfL --max-time 10 "https://raw.githubusercontent.com/maxgfr/ultra11y/${ref}/package.json") || return 1
	printf '%s\n' "$json" | sed -nE 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p' | sed -n 1p
}

first_line=$(printf '%s\n' "$uses_lines" | sed -n 1p)
second_line=$(printf '%s\n' "$uses_lines" | sed -n 2p)
first=$(pin_version "$first_line")
second=$(pin_version "$second_line")
first_ref=$(pin_ref "$first_line")
second_ref=$(pin_ref "$second_line")
dep=$(grep -oE '"ultra11y"[[:space:]]*:[[:space:]]*"[0-9]+\.[0-9]+\.[0-9]+"' "$manifest" | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)"$/\1/')

[ "$count" -eq 2 ] || fail "attendu 2 \`uses: maxgfr/ultra11y@…\` dans a11y.yaml, trouvé $count. Si un tier a été ajouté ou retiré, mets ce script à jour avec lui."
[ -n "$first" ] && [ -n "$second" ] ||
	fail "chaque \`uses:\` doit porter \`@vX.Y.Z\` ou un \`# vX.Y.Z\` (pin SHA de release)."
[ -n "$dep" ] || fail "devDependency \`ultra11y\` introuvable dans packages/app/package.json"

[ "$first_ref" = "$second_ref" ] ||
	fail "les deux tiers de l'Action pointent des refs différentes — $first_ref vs $second_ref. Le commentaire \`# vX.Y.Z\` ne prouve rien : c'est le ref qui EST le moteur."

[ "$first" = "$second" ] ||
	fail "les deux tiers de l'Action divergent — un job en v$first, l'autre en v$second. Ils doivent porter la même version."

engine=""
if engine=$(resolve_engine_version "$first_ref") && [ -n "$engine" ]; then
	[ "$engine" = "$first" ] ||
		fail "le ref $first_ref est ultra11y $engine, le commentaire dit v$first. Aligne le \`# vX.Y.Z\` (ou passe en @vX.Y.Z) : le commentaire ne prouve rien, c'est le ref qui EST le moteur."
	[ "$engine" = "$dep" ] ||
		fail "le ref $first_ref est ultra11y $engine et la devDependency est $dep. Le balayage Playwright écrit les instantanés avec la devDependency et l'Action les réingère avec le sien — alignez-les."
else
	echo "⚠ ultra11y : impossible de résoudre $first_ref vers une version (réseau). Comparaison limitée au commentaire \`# v$first\`." >&2
	[ "$first" = "$dep" ] ||
		fail "l'Action est en v$first et la devDependency en $dep. Le balayage Playwright écrit les instantanés avec la devDependency et l'Action les réingère avec le sien — alignez-les."
fi

echo "✓ ultra11y v$first : les deux tiers de l'Action et la devDependency sont alignés."
