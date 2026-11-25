#!/usr/bin/env bash
# Upserts the sticky review-a11y comment of a PR: one comment per PR, found by its marker, whose
# section <static|rendered> is replaced by the content of <section.md>. The other section is kept.
#
#   post-review-comment.sh <pr-number> <static|rendered> <section.md>
#
# Needs GH_TOKEN (pull-requests: write) and GITHUB_REPOSITORY. GitHub writes can fail
# transiently: each one is retried, then read back.
set -euo pipefail

pr="$1"
section="$2"
section_file="$3"
repo="${GITHUB_REPOSITORY:?}"
here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

retry() {
	local n=0
	until "$@"; do
		n=$((n + 1))
		[ "$n" -ge 4 ] && return 1
		sleep $((n * 5))
	done
}

find_comment() {
	gh api --paginate "repos/$repo/issues/$pr/comments" \
		--jq '.[] | select(.body | startswith("<!-- review-a11y -->")) | .id' </dev/null | head -1
}

# One attempt = find, merge, write. A retry starts over from `find`: a POST that went through
# but answered 500 is found and patched, never posted twice.
upsert() {
	local id
	id="$(find_comment)" || return 1
	if [ -n "$id" ]; then
		gh api "repos/$repo/issues/comments/$id" --jq .body </dev/null >"$work/current.md" || return 1
		node "$here/review-comment.mjs" merge --section "$section" \
			--section-file "$section_file" --body-file "$work/current.md" >"$work/body.md"
		gh api -X PATCH "repos/$repo/issues/comments/$id" -F "body=@$work/body.md" \
			--silent </dev/null
	else
		node "$here/review-comment.mjs" merge --section "$section" \
			--section-file "$section_file" >"$work/body.md"
		gh api -X POST "repos/$repo/issues/$pr/comments" -F "body=@$work/body.md" \
			--silent </dev/null
	fi
}

retry upsert

# Read back: the comment must now carry this section.
id="$(retry find_comment)"
gh api "repos/$repo/issues/comments/$id" --jq .body </dev/null |
	grep -q -- "<!-- review-a11y:$section -->" ||
	{ echo "::warning::review-a11y : le commentaire de la PR #$pr n'a pas pu être relu."; exit 1; }
