---
name: open
description: "Worktree recreation for Codex. Equivalent to the repository's Claude skill: recreate a local worktree for a PR so it can be tested locally. Usage: /open <PR>"
---

# /open

Codex entrypoint for the repository's **PR worktree recreation** flow.

This skill mirrors `.claude/skills/open/SKILL.md`.

## Source of truth

- skill reference: `.claude/skills/open/SKILL.md`
- script: `scripts/orchestration/open_worktree.sh`

## Purpose

Recreate the local worktree associated with a PR so the user can run and inspect it locally.

## Codex rule

- Validate that the argument is a PR number
- Delegate the real logic to `scripts/orchestration/open_worktree.sh`
- Relay the resulting path and local service URLs clearly

## Implementation reference

Follow `.claude/skills/open/SKILL.md` as the exact repository workflow.
