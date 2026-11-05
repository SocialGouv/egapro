#!/usr/bin/env bash
# Forbidden-pattern gate for egapro source code.
#
# Only ADDED lines are inspected (the diff, not the whole file): legacy code is not
# re-litigated, every new line is. Runs from the git pre-commit hook (lefthook.yml),
# from `pnpm verify` and from CI — so it binds humans and every coding agent alike.
#
# Usage:
#   check-patterns.sh --staged              added lines of the index (pre-commit)
#   check-patterns.sh --diff <ref>          added lines since merge-base(<ref>, HEAD), working tree
#                                           and untracked files included (pnpm verify, CI)
#   check-patterns.sh --files <path>...     whole content of the given files
#   check-patterns.sh --self-test           every rule must block its fixture, clean code must pass
#
# Exit: 0 clean · 1 violation(s) found · 2 usage error
#
# Add a rule: one `rule` call in run_rules, plus a fixture in self_test.

set -uo pipefail

VIOLATIONS=0
FILE_PATH=""
CONTENT=""
FILE_STATUS=""

report() {
	local message="$1" sample="${2:-}"
	VIOLATIONS=$((VIOLATIONS + 1))
	printf '✗ %s\n  %s\n' "$FILE_PATH" "$message" >&2
	[ -n "$sample" ] && printf '  > %s\n' "$sample" >&2
}

# rule <file-regex> <content-regex> <message> [<exclude-file-regex>]
rule() {
	local file_filter="$1" pattern="$2" message="$3" exclude_filter="${4:-}"
	if [[ -n "$exclude_filter" ]] && [[ "$FILE_PATH" =~ $exclude_filter ]]; then
		return 0
	fi
	[[ "$FILE_PATH" =~ $file_filter ]] || return 0
	local sample
	sample=$(grep -m1 -E -- "$pattern" <<<"$CONTENT") || return 0
	report "$message" "$(printf '%s' "$sample" | sed -E 's/^[[:space:]]+//' | cut -c1-160)"
}

NOT_DOMAIN_OR_TEST='(domain/|__tests__|\.test\.|\.spec\.)'

run_rules() {
	# DSFR text colors use fr-text-{role}--{color}; fr-text--* is for typography.
	rule '\.(tsx|jsx)$' \
		'fr-text--(mention|default|label|title|inverted)-' \
		'Invalid DSFR text color class. Use fr-text-mention--grey, fr-text-default--grey, etc.; fr-text--* is for typography.'

	rule '\.(ts|tsx|js|jsx)$' \
		'biome-ignore|eslint-disable|@ts-ignore|@ts-expect-error' \
		'Suppression comments are forbidden. Fix the underlying issue instead.'

	# @react-pdf/renderer and @react-email components require style={}.
	rule '\.(tsx|jsx)$' \
		'style=\{' \
		'Inline style={{}} is forbidden. Use DSFR classes or a scoped SCSS module.' \
		'(declarationPdf/|noSanctionAttestation/|packages/notifications/)'

	# DsfrPictogram is the only SVG wrapper; emails need inline SVG (Outlook strips linked images).
	rule '\.(tsx|jsx)$' \
		'<svg[[:space:]>]' \
		'Inline <svg> is forbidden. Use DsfrPictogram, public/assets/*.svg + <Image> (next/image), or DSFR icon classes (fr-icon-*).' \
		'(DsfrPictogram\.tsx|ErrorArtwork\.tsx|packages/notifications/)'

	# Standalone node scripts, configs and e2e helpers run outside the Next.js runtime.
	rule '\.(ts|tsx)$' \
		'process\.env' \
		'Direct process.env is forbidden. Use: import { env } from "~/env.js".' \
		'(env\.js|instrumentation(-client)?\.ts|next\.config|trpc/react\.tsx|sentry\.(client|server|edge)\.config\.ts|global-setup\.ts|integration-setup\.ts|playwright\.config|drizzle[^/]*\.config|packages/app/scripts/|e2e/helpers/|packages/notifications/)'

	rule '\.(ts|tsx)$' \
		'(\.\./){2,}' \
		'Deep relative imports (../../ or deeper) are forbidden. Use the ~/ path alias.' \
		'(packages/notifications/)'

	rule '\.scss$' \
		'#[0-9a-fA-F]{3,8}' \
		'Hardcoded hex colors are forbidden in SCSS. Use DSFR CSS custom properties (var(--background-*, --text-*, --border-*, --artwork-*)).'

	rule '\.scss$' \
		'rgba?\(' \
		'Hardcoded rgb()/rgba() colors are forbidden in SCSS. Use DSFR CSS custom properties.'

	rule '\.scss$' \
		'@media[[:space:]]+.*((min|max)-width|screen)' \
		'Raw @media queries are forbidden. Use DSFR mixins: @include respond-from(md) or @include respond-to(sm).'

	rule '\.(tsx|jsx)$' \
		'dangerouslySetInnerHTML' \
		'dangerouslySetInnerHTML is forbidden (XSS risk). Use safe rendering or DOMPurify if absolutely necessary.'

	rule '\.(ts|tsx)$' \
		'(: any[^a-zA-Z]|as any[^a-zA-Z]|: any$|as any$)' \
		'Explicit `any` type is forbidden. Use `unknown` with type narrowing instead.' \
		'(__tests__|\.test\.|\.spec\.)'

	# Emails need raw <img> with absolute URLs (next/image is unusable in mail clients).
	rule '\.(tsx|jsx)$' \
		'<img[[:space:]>]' \
		'Raw <img> is forbidden. Use: import Image from "next/image".' \
		'(__tests__|\.test\.|\.spec\.|setup\.ts|packages/notifications/)'

	rule '\.(ts|tsx)$' \
		'getFullYear\(\)' \
		'Inline getFullYear() is forbidden. Use getCurrentYear(), getWorkforceYear() or getReferenceYearFor() from ~/modules/domain.' \
		"$NOT_DOMAIN_OR_TEST"

	rule '\.(ts|tsx)$' \
		'slice\(0,[[:space:]]*9\)' \
		'Inline slice(0, 9) is forbidden. Use extractSiren() from ~/modules/domain.' \
		"$NOT_DOMAIN_OR_TEST"

	rule '\.(ts|tsx)$' \
		'(substring|substr)\(0,[[:space:]]*9\)' \
		'Inline substring/substr(0, 9) is forbidden. Use extractSiren() from ~/modules/domain.' \
		"$NOT_DOMAIN_OR_TEST"

	rule '\.(ts|tsx)$' \
		'\.(getMonth|getDate)\(\)' \
		'Inline .getMonth()/.getDate() is forbidden. Use campaign date helpers from ~/modules/domain.' \
		"$NOT_DOMAIN_OR_TEST"

	rule '\.(ts|tsx)$' \
		'(>=|<)[[:space:]]*GAP_ALERT_THRESHOLD' \
		'Inline gap threshold comparison is forbidden. Use gapLevel(gap) === "high" from ~/modules/domain (or a named domain helper for the "either direction" intent).' \
		"$NOT_DOMAIN_OR_TEST"

	rule '\.(ts|tsx)$' \
		'\([[:space:]]*[a-zA-Z_.]*[mM]en[a-zA-Z_.]*[[:space:]]*-[[:space:]]*[a-zA-Z_.]*[wW]omen' \
		'Inline ((men - women)/men) gap formula is forbidden. Use computeGap()/computeGapBetween() from ~/modules/domain.' \
		"$NOT_DOMAIN_OR_TEST"

	rule '\.(ts|tsx)$' \
		'cancelledAt[[:space:]]*!==?[[:space:]]*null' \
		'Inline cancelledAt !== null is forbidden. Use isCancelled() from ~/modules/domain.' \
		"$NOT_DOMAIN_OR_TEST"

	rule '\.(ts|tsx)$' \
		'(slice|substring|substr)\(0,[[:space:]]*[A-Za-z_]*SIREN[A-Za-z_]*\)|SIREN_LENGTH[[:space:]]*=[[:space:]]*9' \
		'Inline SIREN extraction is forbidden (even via a SIREN_LENGTH const). Use extractSiren()/parseSiren() from ~/modules/domain.' \
		"$NOT_DOMAIN_OR_TEST"

	# Scoped to src/modules/. export/fetchDeclarations.ts serialises a gap ratio into the SUIT
	# API's fixed-decimal contract with .toFixed(4) — a wire format, not a rendered value.
	rule 'src/modules/.*\.(ts|tsx)$' \
		'\.toLocale(Date|Time)?String\(|Intl\.(NumberFormat|DateTimeFormat)|\.toFixed\(' \
		'Inline display formatting is forbidden outside the domain. Use a formatter from ~/modules/domain (shared/format.ts), or add the missing one there.' \
		'(domain/|__tests__|__fixtures__|\.test\.|\.spec\.|export/fetchDeclarations\.ts)'

	# The formatter splits this call across lines: match on a newline-flattened copy.
	if [[ "$FILE_PATH" =~ \.(ts|tsx)$ ]] && [[ ! "$FILE_PATH" =~ $NOT_DOMAIN_OR_TEST ]]; then
		if printf '%s' "$CONTENT" | tr '\n' ' ' | grep -qE 'isIndicatorGRequired\([[:space:]]*getObligationWorkforce'; then
			report 'Inline isIndicatorGRequired(getObligationWorkforce(...)) composition is forbidden. Use isIndicatorGRequiredForGip() from ~/modules/domain.'
		fi
	fi

	rule 'routers/.*\.ts$' \
		"from ['\"]zod['\"]" \
		'Zod imports are forbidden in router files. Import schemas from ~/modules/{domain}/schemas.ts.'

	rule '\.tsx$' \
		"from ['\"]zod['\"]" \
		'Zod imports are forbidden in components. Import schemas from ~/modules/{domain}/schemas.ts.' \
		'(__tests__|\.test\.|\.spec\.)'

	# src/app/ holds Next.js route files only; checked when a file is added.
	if [[ "$FILE_STATUS" = "A" ]] && [[ "$FILE_PATH" =~ src/app/.*\.tsx$ ]]; then
		case "$(basename "$FILE_PATH" .tsx)" in
		page | layout | loading | error | not-found | global-error | template | default | opengraph-image | icon | apple-icon) ;;
		*) report 'Custom components are forbidden in src/app/. Move to src/modules/ and import from the barrel.' ;;
		esac
	fi
}

CHECKED_EXT='\.(ts|tsx|js|jsx|scss)$'

check_one() {
	FILE_PATH="$1"
	FILE_STATUS="$2"
	CONTENT="$3"
	[ -n "$CONTENT" ] || [ "$FILE_STATUS" = "A" ] || return 0
	run_rules
}

added_lines() {
	sed -n 's/^+//p' | grep -v '^++ ' || true
}

check_diff() {
	local diff_args=("$@") status path
	while IFS=$'\t' read -r status path; do
		[[ "$path" =~ $CHECKED_EXT ]] || continue
		check_one "$path" "${status:0:1}" "$(git diff -U0 --no-color "${diff_args[@]}" -- "$path" | added_lines)"
	done < <(git diff --name-status --no-renames --diff-filter=AM "${diff_args[@]}")
}

check_untracked() {
	local path
	while IFS= read -r path; do
		[[ "$path" =~ $CHECKED_EXT ]] || continue
		check_one "$path" "A" "$(cat -- "$path")"
	done < <(git ls-files --others --exclude-standard)
}

self_test() {
	local failures=0
	expect() {
		local want="$1" path="$2" status="$3" content="$4" before=$VIOLATIONS
		check_one "$path" "$status" "$content" 2>/dev/null
		local got="pass"
		[ "$VIOLATIONS" -gt "$before" ] && got="block"
		if [ "$got" != "$want" ]; then
			failures=$((failures + 1))
			printf 'self-test FAIL: expected %s, got %s — %s: %s\n' "$want" "$got" "$path" "${content:0:120}" >&2
		fi
	}
	local m='packages/app/src/modules/demo/Demo.tsx'
	local t='packages/app/src/modules/demo/demo.ts'
	expect block "$m" M '<p className="fr-text--mention-grey">x</p>'
	expect block "$t" M '// biome-ignore lint/x: y'
	expect block "$t" M '// @ts-expect-error'
	expect block "$m" M '<div style={{ margin: 0 }} />'
	expect pass 'packages/app/src/modules/declarationPdf/Doc.tsx' M '<View style={{ margin: 0 }} />'
	expect block "$m" M '<svg viewBox="0 0 1 1">'
	expect block "$t" M 'const url = process.env.SITE_URL;'
	expect pass 'packages/app/next.config.ts' M 'const x = process.env.X;'
	expect block "$t" M "$(printf 'const url = process.env.SITE_URL;\n'; yes 'const filler = "padding padding padding padding padding padding padding";' | head -n 2000)"
	expect block "$t" M 'import { x } from "../../shared";'
	expect block 'packages/app/src/modules/demo/demo.module.scss' M 'color: #fff;'
	expect block 'packages/app/src/modules/demo/demo.module.scss' M 'color: rgba(0, 0, 0, 0.5);'
	expect block 'packages/app/src/modules/demo/demo.module.scss' M '@media (min-width: 48em) {'
	expect pass 'packages/app/src/modules/demo/demo.module.scss' M '@media print {'
	expect block "$m" M '<div dangerouslySetInnerHTML={{ __html: x }} />'
	expect block "$t" M 'const x: any = 1;'
	expect block "$t" M 'return y as any;'
	expect pass 'packages/app/src/modules/demo/__tests__/demo.test.ts' M 'const x = y as any;'
	expect block "$m" M '<img src="/a.png" alt="" />'
	expect block "$t" M 'const year = new Date().getFullYear();'
	expect pass 'packages/app/src/modules/domain/shared/year.ts' M 'const year = new Date().getFullYear();'
	expect block "$t" M 'const siren = siret.slice(0, 9);'
	expect block "$t" M 'const siren = siret.substring(0, 9);'
	expect block "$t" M 'const m = d.getMonth();'
	expect block "$t" M 'if (gap >= GAP_ALERT_THRESHOLD) {}'
	expect block "$t" M 'const gap = (menAverage - womenAverage) / menAverage;'
	expect block "$t" M 'return d.cancelledAt !== null;'
	expect block "$t" M 'const SIREN_LENGTH = 9;'
	expect block "$t" M 'const label = n.toFixed(1);'
	expect pass 'packages/app/src/server/db/settings.ts' M 'const label = n.toFixed(1);'
	expect block "$t" M "$(printf 'const r = isIndicatorGRequired(\n  getObligationWorkforce(c),\n);')"
	expect block 'packages/app/src/server/api/routers/demo.ts' M 'import { z } from "zod";'
	expect block "$m" M 'import { z } from "zod";'
	expect block 'packages/app/src/app/ma-route/MonComposant.tsx' A 'export function MonComposant() {}'
	expect pass 'packages/app/src/app/ma-route/page.tsx' A 'export default function Page() {}'
	expect pass "$m" M 'import { formatPercent } from "~/modules/domain";'
	if [ "$failures" -gt 0 ]; then
		echo "check-patterns self-test: $failures failure(s)" >&2
		exit 1
	fi
	echo "check-patterns self-test: OK"
	exit 0
}

cd "$(git rev-parse --show-toplevel)" || exit 2

case "${1:-}" in
--staged)
	check_diff --cached
	;;
--diff)
	ref="${2:-}"
	[ -n "$ref" ] || {
		echo "usage: $0 --diff <ref>" >&2
		exit 2
	}
	base=$(git merge-base "$ref" HEAD) || {
		echo "check-patterns: cannot resolve merge-base with $ref" >&2
		exit 2
	}
	check_diff "$base"
	check_untracked
	;;
--files)
	shift
	for f in "$@"; do
		[[ "$f" =~ $CHECKED_EXT ]] || continue
		check_one "$f" "A" "$(cat -- "$f")"
	done
	;;
--self-test)
	self_test
	;;
*)
	sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
	exit 2
	;;
esac

if [ "$VIOLATIONS" -gt 0 ]; then
	echo "check-patterns: $VIOLATIONS violation(s). Fix the code — these rules are not bypassed." >&2
	exit 1
fi
echo "check-patterns: OK"
