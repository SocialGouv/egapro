---
name: implement
description: "Execution pipeline for Codex. Detect epic/task/bug mode and implement with Codex models only. Usage: /implement <issue#>"
---

# /implement

Codex-native entrypoint for the repository implementation pipeline.

## Hard constraint: Codex models only

- Never invoke the `claude` CLI or any script that dispatches Claude agents.
- In particular, do not run `epic_loop.sh`, `run_e2e_dev.sh`,
  `run_architect_rework.sh`, or `run_doc_writer.sh` while they invoke Claude.
- The current Codex agent owns the implementation end to end.
- When independent or parallel work is useful, use Codex collaboration agents.
  They inherit the current Codex model by default. For a ticket labelled
  `complexe`, prefer the strongest available Codex model and a high reasoning
  effort.

The files under `.claude/agents/` and `.claude/rules/` remain repository process
references and checklists. Their instructions to invoke Claude, their model names,
and their JSON transport contract do not apply to Codex.

## Source of truth

- Neutral orchestration helpers: `scripts/orchestration/*.sh`
- Development checklist: `.claude/agents/code-dev/AGENT.md`
- Bug workflow: `.claude/rules/bug-fix-workflow.md`
- E2E ownership and proportionality: `.claude/agents/e2e-dev/AGENT.md`

Reuse scripts that manage GitHub, branches, worktrees, board state, and logging.
Do not use scripts whose purpose is to start a Claude agent.

## Workflow

1. Validate the issue number and inspect its type, state, parent, labels, body,
   and comments.
2. Require the expected analysis marker:
   - Feature: sub-issues and `## Analyse PO`
   - Task: `## Analyse architecte`
   - Bug: `## Analyse du bug`
3. Select the base branch: `origin/epic/<parent>` for an epic child, otherwise
   `origin/alpha`.
4. Create or reuse a dedicated worktree and linked ticket branch, provision its
   stack with `scripts/setup-worktree.sh`, and move the ticket to `In progress`.
5. Implement directly with the current Codex agent. Follow the code-dev checklist,
   including tests, red/green revert verification for bugs, one-shot verification,
   required logging events, and repository conventions. Never modify E2E files in
   this phase.
6. Run the quality gates with Codex: typecheck, unit/integration tests, lint,
   formatting, structural review, accessibility review for UI changes, and security
   review for server changes. Codex subagents may perform independent reviews when
   available; the primary Codex agent remains responsible for resolving findings.
7. Commit, push, open a draft PR with `Closes #<issue>` on the first line, force the
   formal issue link, verify CI/Sonar/review feedback, and mark the PR ready only
   after all gates pass. Keep the ticket `In progress` for the user to move.
8. Apply the E2E checklist with Codex after code validation. For a Bug, choose only
   `nested` or `none`; use `none` when permanent E2E coverage is disproportionate
   and document the reason on the issue. If E2E files are changed, validate and push
   them to the same PR branch.

## Epic mode

For a Feature, the primary Codex agent orchestrates the analysed sub-issues using
Codex collaboration agents and the neutral branch/worktree helpers. Respect ticket
dependencies, integrate validated child PRs into `epic/<N>`, run the final E2E and
documentation gates with Codex, then open the final PR to `alpha`. Do not start the
legacy Claude-backed loop driver.

## Completion report

Report the ticket, branch, PR, validations, E2E decision, and any remaining external
CI state. Do not claim completion when required gates or the PR are missing.
