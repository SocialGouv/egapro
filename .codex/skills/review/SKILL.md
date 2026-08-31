---
name: review
description: "Review-fix pipeline for Codex. Equivalent to the repository's Claude skill: collect review feedback, apply fixes through the existing review workflow, and prepare replies. Usage: /review [<issue#>|<PR#>]"
---

# /review

Codex entrypoint for the repository's **review-fix workflow**.

This skill mirrors `.claude/skills/review/SKILL.md` and reuses the repository's existing review process.

## Source of truth

- skill reference: `.claude/skills/review/SKILL.md`
- review agent: `.claude/agents/review-fixer/AGENT.md`
- quality gates: `.claude/agents/{validator,structural-auditor,rgaa-auditor,security-auditor}/AGENT.md`
- GitHub artefact hygiene: `.claude/rules/git-artefact-hygiene.md`

## Purpose

Handle unresolved review comments on PRs in one of three scopes:

- epic review
- task review
- bug review

## Codex rule

- Reuse the existing worktree-based review flow
- Apply fixes on the correct working branch
- Preserve the explicit user gate before posting public replies
- Never use force-push without explicit user approval

## Expected outputs

- fixes applied
- validations rerun
- replies prepared, and only posted after user approval

## Implementation reference

Follow `.claude/skills/review/SKILL.md` as the exact repository workflow.
