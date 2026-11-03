#!/usr/bin/env bash
# Rejoue check-ultra11y-version.sh sur des dépôts factices : il doit accepter un nombre
# quelconque de `uses:` alignés, et refuser toute demi-montée. Les refs sont des SHA inventés,
# que curl ne résout pas : la comparaison retombe sur le commentaire `# vX.Y.Z`.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
script="$here/check-ultra11y-version.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

SHA_A=0000000000000000000000000000000000000001
SHA_B=0000000000000000000000000000000000000002
failures=0

fixture() {
	local name="$1" dep="$2"
	shift 2
	local dir="$tmp/$name"
	mkdir -p "$dir/.github/workflows" "$dir/packages/app"
	printf '{\n\t"devDependencies": {\n\t\t"ultra11y": "%s"\n\t}\n}\n' "$dep" >"$dir/packages/app/package.json"
	while [ "$#" -gt 0 ]; do
		printf 'jobs:\n  x:\n    steps:\n%b' "$2" >"$dir/.github/workflows/$1"
		shift 2
	done
	printf '%s' "$dir"
}

uses() {
	printf '      - uses: SocialGouv/ultra11y@%s # v%s\\n' "$1" "$2"
}

expect() {
	local want="$1" label="$2" dir="$3"
	if "$script" "$dir" >/dev/null 2>&1; then got=pass; else got=fail; fi
	if [ "$got" = "$want" ]; then
		echo "ok   — $label"
	else
		echo "FAIL — $label (attendu $want, obtenu $got)"
		failures=$((failures + 1))
	fi
}

expect pass "deux workflows, quatre uses alignés" "$(fixture aligned 5.58.1 \
	a11y.yaml "$(uses $SHA_A 5.58.1)$(uses $SHA_A 5.58.1)" \
	a11y-lite.yaml "$(uses $SHA_A 5.58.1)$(uses $SHA_A 5.58.1)")"

expect pass "un seul uses" "$(fixture single 5.58.1 a11y.yaml "$(uses $SHA_A 5.58.1)")"

expect fail "le nouveau workflow resté sur l'ancienne version" "$(fixture half-version 5.58.1 \
	a11y.yaml "$(uses $SHA_A 5.58.1)$(uses $SHA_A 5.58.1)" \
	a11y-lite.yaml "$(uses $SHA_A 5.58.1)$(uses $SHA_A 5.55.0)")"

expect fail "même commentaire, refs différentes" "$(fixture half-ref 5.58.1 \
	a11y.yaml "$(uses $SHA_A 5.58.1)" \
	a11y-lite.yaml "$(uses $SHA_B 5.58.1)")"

expect fail "devDependency non montée" "$(fixture half-dep 5.55.0 \
	a11y.yaml "$(uses $SHA_A 5.58.1)" \
	a11y-lite.yaml "$(uses $SHA_A 5.58.1)")"

expect fail "uses sans version lisible" "$(fixture unpinned 5.58.1 \
	a11y.yaml '      - uses: SocialGouv/ultra11y@main\n')"

expect fail "aucun uses" "$(fixture none 5.58.1 a11y.yaml '      - run: true\n')"

[ "$failures" -eq 0 ] || {
	echo "$failures cas en échec" >&2
	exit 1
}
echo "check-ultra11y-version : tous les cas passent."
