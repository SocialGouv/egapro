#!/usr/bin/env bash
# LA VERSION D'ULTRA11Y VIT À PLUSIEURS ENDROITS DANS CE DÉPÔT, ET ILS DOIVENT S'ACCORDER.
#
#   - chaque `uses: SocialGouv/ultra11y@…` de `.github/workflows/` — la gate PR et `a11y-pages`
#     dans `a11y.yaml`, les deux étapes du mode lite dans `a11y-lite.yaml`, et tout tier ajouté
#     plus tard. Le moteur est embarqué dans l'Action. La version se lit soit sur `@vX.Y.Z`,
#     soit sur un `# vX.Y.Z` quand le ref est un SHA de release (les tags peuvent disparaître
#     en amont alors que le commit reste) ;
#   - `packages/app/package.json` — la devDependency `ultra11y`. Ce n'est pas un doublon
#     décoratif : c'est le binaire (`pnpm exec ultra11y`) et le plugin Playwright
#     (`ultra11y/playwright`) dont `src/e2e/a11y/` se sert pour ÉCRIRE les instantanés que
#     l'Action réingère ensuite avec SON moteur.
#
# Deux versions, deux formats d'instantané — et la divergence ne lève aucune erreur : elle se
# lit comme des critères « à évaluer » dans un rapport qui a l'air complet. En mode lite, elle
# fait pire : une baseline écrite par une autre version ne bloque plus rien.
#
# Dependabot met bien tout à jour, mais dans des PR séparées et sur deux écosystèmes
# (`github-actions` et `npm`) : il n'a aucun moyen de savoir qu'elles vont ensemble. Ce script
# est ce qui refuse une demi-montée de version.
#
# Sortie 0 si tout s'accorde, 1 sinon. grep/sed en local ; curl pour résoudre un SHA vers
# la version publiée dans package.json amont (repli sur le commentaire si hors ligne).
set -euo pipefail

root="${1:-$(git rev-parse --show-toplevel)}"
workflows="$root/.github/workflows"
manifest="$root/packages/app/package.json"

fail() {
  echo "✗ ultra11y : $1" >&2
  exit 1
}

[ -d "$workflows" ] || fail "répertoire introuvable : $workflows"
[ -f "$manifest" ] || fail "fichier introuvable : $manifest"

# Lignes `uses:` seulement — un SHA cité dans un commentaire du workflow ne compte pas.
uses_lines=$(grep -HE '^[[:space:]]*(-[[:space:]]+)?uses:[[:space:]]*SocialGouv/ultra11y@' "$workflows"/*.yaml "$workflows"/*.yml 2>/dev/null || true)
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
	printf '%s\n' "$1" | sed -E 's|^[^:]*:[[:space:]]*(-[[:space:]]+)?uses:[[:space:]]*SocialGouv/ultra11y@([^[:space:]#]+).*|\2|'
}

resolve_engine_version() {
	local ref="$1"
	command -v curl >/dev/null 2>&1 || return 1
	local json
	json=$(curl -sfL --max-time 10 "https://raw.githubusercontent.com/SocialGouv/ultra11y/${ref}/package.json") || return 1
	printf '%s\n' "$json" | sed -nE 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p' | sed -n 1p
}

[ "$count" -ge 1 ] || fail "aucun \`uses: SocialGouv/ultra11y@…\` dans $workflows — si l'Action a été retirée, retire ce script avec elle."

dep=$(grep -oE '"ultra11y"[[:space:]]*:[[:space:]]*"[0-9]+\.[0-9]+\.[0-9]+"' "$manifest" | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)"$/\1/')
[ -n "$dep" ] || fail "devDependency \`ultra11y\` introuvable dans packages/app/package.json (version exacte attendue, sans ^ ni ~)"

first_line=$(printf '%s\n' "$uses_lines" | sed -n 1p)
first=$(pin_version "$first_line")
first_ref=$(pin_ref "$first_line")
first_where=${first_line%%:*}

while IFS= read -r line; do
	where=${line%%:*}
	version=$(pin_version "$line")
	ref=$(pin_ref "$line")
	[ -n "$version" ] ||
		fail "${where#"$root"/} : chaque \`uses:\` doit porter \`@vX.Y.Z\` ou un \`# vX.Y.Z\` (pin SHA de release)."
	[ "$ref" = "$first_ref" ] ||
		fail "les tiers de l'Action pointent des refs différentes — $first_ref (${first_where#"$root"/}) vs $ref (${where#"$root"/}). Le commentaire \`# vX.Y.Z\` ne prouve rien : c'est le ref qui EST le moteur."
	[ "$version" = "$first" ] ||
		fail "les tiers de l'Action divergent — v$first (${first_where#"$root"/}) vs v$version (${where#"$root"/}). Ils doivent porter la même version."
done <<<"$uses_lines"

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

echo "✓ ultra11y v$first : les $count \`uses:\` de l'Action et la devDependency sont alignés."
