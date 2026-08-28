---
name: implement
description: "Execution pipeline for Codex. Equivalent to the repository's Claude skill: detect epic/task/bug mode and launch the existing scripts/agents. Usage: /implement <issue#>"
---

# /implement

Codex entrypoint for the repository's **execution pipeline**.

This skill mirrors `.claude/skills/implement/SKILL.md`. The repository already defines the implementation mechanics; Codex should reuse them instead of introducing a second orchestration system.

## Source of truth

- skill reference: `.claude/skills/implement/SKILL.md`
- orchestration scripts: `scripts/orchestration/*.sh`
- execution agent: `.claude/agents/code-dev/AGENT.md`
- bug workflow: `.claude/rules/bug-fix-workflow.md`

## Mode mapping

- `Feature` -> epic mode via `scripts/orchestration/epic_loop.sh`
- `Task` -> synchronous `code-dev` workflow
- `Bug` -> synchronous `code-dev` workflow with bug-fix conventions

## Codex rule

- Verify the issue has already been analysed before dispatching work
- Reuse existing scripts for epic orchestration
- Reuse the existing `code-dev` process for single-ticket execution
- Do not duplicate orchestration logic inside the skill

## Expected outputs

- epic mode -> background loop plus reporting
- task/bug mode -> final status report based on the execution result

## Implementation reference

Follow `.claude/skills/implement/SKILL.md` as the exact repository workflow.
