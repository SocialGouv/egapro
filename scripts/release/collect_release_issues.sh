#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# collect_release_issues.sh <tag>
#
# Collects the business-relevant issues/PRs shipped in a release tag, for the
# AI changelog workflow (release-changelog.yaml) to summarize.
#
# Range: commits between the previous reachable tag and <tag>. If no
# reachable previous tag exists (first alpha tag ever, shallow history…),
# falls back to the last 30 commits reachable from <tag>.
#
# For every squash-merge commit in that range, extracts the PR number
# (trailing "(#N)" in the commit subject) and looks up its linked issues
# (closingIssuesReferences). Each linked issue becomes one output entry
# (issue number + title + labels + originating PR). PRs without a linked
# issue are used as their own entry.
#
# Deterministic pre-filter (exclusion), applied to every entry's title and
# labels, so purely technical work never reaches the AI prompt:
#   - conventional-commit type prefix in the title:
#     chore|ci|build|perf|test|refactor|style|docs
#   - labels: "cat: technique", "tâche technique", "type: ci", "type: chore",
#     "type: build", "dependencies", "github_actions"
#
# Output: JSON array on stdout —
#   [{"issue": <number|null>, "title": "...", "labels": ["..."], "pr": <number>}, ...]
# An empty range or an all-technical range prints "[]".
#
# Usage:
#   collect_release_issues.sh <tag>
#
# Example (local test against an existing alpha tag):
#   git fetch --tags
#   scripts/release/collect_release_issues.sh v3.14.0-alpha.5
#
# Env:
#   GITHUB_REPOSITORY  — "owner/repo" (default: SocialGouv/egapro)
#
# Requires: git, gh (authenticated), jq.

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <tag>" >&2
    exit 2
fi

TAG="$1"
REPO="${GITHUB_REPOSITORY:-SocialGouv/egapro}"

if ! git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
    echo "[collect_release_issues] ERROR: tag '${TAG}' not found locally (did you fetch --tags / fetch-depth: 0?)" >&2
    exit 2
fi

PREV_TAG=$(git describe --tags --abbrev=0 "${TAG}^" 2>/dev/null || echo "")

if [ -n "$PREV_TAG" ]; then
    echo "[collect_release_issues] range: ${PREV_TAG}..${TAG}" >&2
    COMMIT_SUBJECTS=$(git log --format='%s' "${PREV_TAG}..${TAG}")
else
    echo "[collect_release_issues] no reachable previous tag, falling back to the last 30 commits before ${TAG}" >&2
    COMMIT_SUBJECTS=$(git log --format='%s' -30 "${TAG}")
fi

PR_NUMBERS=$(echo "$COMMIT_SUBJECTS" | { grep -oE '\(#[0-9]+\)$' || true; } | { grep -oE '[0-9]+' || true; } | sort -un)

if [ -z "$PR_NUMBERS" ]; then
    echo "[collect_release_issues] no PR numbers found in commit range" >&2
    echo "[]"
    exit 0
fi

TECHNICAL_LABELS_JSON='["cat: technique","tâche technique","type: ci","type: chore","type: build","dependencies","github_actions"]'

is_technical_title() {
    echo "$1" | grep -qiE '^(chore|ci|build|perf|test|refactor|style|docs)(\([^)]*\))?!?:'
}

is_technical_labels() {
    jq -e --argjson tech "$TECHNICAL_LABELS_JSON" \
        'any(.[]; . as $l | $tech | index($l) != null)' >/dev/null 2>&1 <<<"$1"
}

ENTRIES="[]"

for PR in $PR_NUMBERS; do
    PR_JSON=$(gh pr view "$PR" --repo "$REPO" --json title,labels,closingIssuesReferences 2>/dev/null) || {
        echo "[collect_release_issues] WARN: could not fetch PR #${PR}, skipping" >&2
        continue
    }

    PR_TITLE=$(jq -r '.title' <<<"$PR_JSON")
    PR_LABELS=$(jq -c '[.labels[].name]' <<<"$PR_JSON")
    LINKED_ISSUES=$(jq -c '[.closingIssuesReferences[].number]' <<<"$PR_JSON")
    LINKED_COUNT=$(jq 'length' <<<"$LINKED_ISSUES")

    if [ "$LINKED_COUNT" -eq 0 ]; then
        if is_technical_title "$PR_TITLE" || is_technical_labels "$PR_LABELS"; then
            continue
        fi
        ENTRY=$(jq -n --arg title "$PR_TITLE" --argjson labels "$PR_LABELS" --argjson pr "$PR" \
            '{issue: null, title: $title, labels: $labels, pr: $pr}')
        ENTRIES=$(jq --argjson e "$ENTRY" '. + [$e]' <<<"$ENTRIES")
        continue
    fi

    for ISSUE in $(jq -r '.[]' <<<"$LINKED_ISSUES"); do
        ISSUE_JSON=$(gh issue view "$ISSUE" --repo "$REPO" --json title,labels 2>/dev/null) || {
            echo "[collect_release_issues] WARN: could not fetch issue #${ISSUE}, skipping" >&2
            continue
        }
        ISSUE_TITLE=$(jq -r '.title' <<<"$ISSUE_JSON")
        ISSUE_LABELS=$(jq -c '[.labels[].name]' <<<"$ISSUE_JSON")

        if is_technical_title "$ISSUE_TITLE" || is_technical_labels "$ISSUE_LABELS"; then
            continue
        fi

        ENTRY=$(jq -n --argjson issue "$ISSUE" --arg title "$ISSUE_TITLE" --argjson labels "$ISSUE_LABELS" --argjson pr "$PR" \
            '{issue: $issue, title: $title, labels: $labels, pr: $pr}')
        ENTRIES=$(jq --argjson e "$ENTRY" '. + [$e]' <<<"$ENTRIES")
    done
done

jq 'unique_by(if .issue != null then "issue-" + (.issue | tostring) else "pr-" + (.pr | tostring) end)' <<<"$ENTRIES"
