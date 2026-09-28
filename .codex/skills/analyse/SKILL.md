---
name: analyse
description: "Conception pipeline for Codex. Equivalent to the repository's Claude skill: detect epic/task/bug mode, then delegate to the existing repo agents and workflows. Usage: /analyse [<issue#>] [<description>]"
---

# /analyse

Codex entrypoint for the repository's **conception pipeline**.

This skill is intentionally equivalent to `.claude/skills/analyse/SKILL.md`, but framed for Codex. The underlying workflow and source of truth remain the same:

- repo skill reference: `.claude/skills/analyse/SKILL.md`
- repo agents: `.claude/agents/{product-owner,architect,bug-analyst}/AGENT.md`
- repo formatting/spec rules: `.claude/rules/ticket-spec-format.md`

## Purpose

Detect the mode from the issue or prompt, then drive the correct repository analysis workflow:

- `Feature` / feature request -> epic mode
- `Task` -> architect task analysis
- `Bug` -> bug diagnosis

## Codex rule

Do not invent a parallel analysis process. Reuse the repository's existing one and keep the same outputs:

- epic -> GitHub epic plus sub-issues
- task -> `## Analyse architecte`
- bug -> `## Analyse du bug`

## Operating notes

- If the target issue exists, inspect its type and comments first
- If the request is ambiguous, ask the user to choose epic, task, or bug
- Keep the issue body intact for task/bug modes; analysis lives in comments
- Do not move board statuses during analysis

## Implementation reference

Follow `.claude/skills/analyse/SKILL.md` as the exact repository workflow.
