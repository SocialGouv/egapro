---
name: doc
description: "Documentation regeneration for Codex. Equivalent to the repository's Claude skill: regenerate user-facing docs from current code state. Usage: /doc or /doc <issue#>"
---

# /doc

Codex entrypoint for the repository's **documentation regeneration workflow**.

This skill mirrors `.claude/skills/doc/SKILL.md`.

## Source of truth

- skill reference: `.claude/skills/doc/SKILL.md`
- doc agent: `.claude/agents/doc-writer/AGENT.md`
- orchestration helper: `scripts/orchestration/run_doc_writer.sh`

## Purpose

Regenerate user-facing documentation from the current codebase state while preserving the repository's existing branching and push rules.

## Codex rule

- Refuse to run on a dirty working tree
- Reuse the existing branch-resolution logic
- Use the current branch for local-only runs
- Use the issue-linked or epic branch when invoked with an issue number

## Expected outputs

- `updated`
- `no_changes`
- `rate_limited`
- `failed`

## Implementation reference

Follow `.claude/skills/doc/SKILL.md` as the exact repository workflow.
