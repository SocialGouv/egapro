---
name: report
description: "Epic/report dashboard for Codex. Equivalent to the repository's Claude skill: render the orchestration state from bash scripts and summarize it cleanly. Usage: /report [<epic_N> ...]"
---

# /report

Codex entrypoint for the repository's **orchestration dashboard**.

This skill mirrors `.claude/skills/report/SKILL.md`.

## Source of truth

- skill reference: `.claude/skills/report/SKILL.md`
- scripts: `scripts/orchestration/render_dashboard.sh`, `scripts/orchestration/epic_state.sh`

## Purpose

Render the state of active agents and epic progress from repository-maintained bash scripts, then present the result in clean markdown with a short analysis.

## Codex rule

- Always source data from the existing scripts
- Do not invent state that the scripts did not provide
- Reformat raw shell output into readable markdown tables if needed
- In auto-report mode, respect the existing stop condition around the final `epic/<N> -> alpha` PR

## Implementation reference

Follow `.claude/skills/report/SKILL.md` as the exact repository workflow.
