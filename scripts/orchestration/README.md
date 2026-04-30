# `scripts/orchestration/`

Bash drivers used by the `/epic`, `/code`, `/report`, `/open` skills to dispatch tickets to sub-agents in parallel worktrees. See [`/Users/llf/.claude/rules/automation.md`](../../.claude/rules/automation.md) and [`.claude/skills/epic/SKILL.md`](../../.claude/skills/epic/SKILL.md) for the higher-level workflow.

---

## Prerequisites

Beyond the project's standard `pnpm` / Docker setup, the orchestration scripts require:

| Tool | Why | Linux | macOS |
|---|---|---|---|
| **bash 4+** | `declare -A` (associative arrays) used by `dispatch_plan.sh`, `epic_loop.sh`, `open_worktree.sh` | usually default | `brew install bash` (macOS ships `/bin/bash` 3.2 due to GPL licensing) |
| **GNU `timeout`** | `epic_loop.sh` enforces a per-sub-agent wall-clock cap | from `coreutils`, default | `brew install coreutils` (provides `gtimeout`; the loop driver auto-detects either `gtimeout` or `timeout`) |
| `jq` | JSON aggregation in every script | `apt install jq` | `brew install jq` |
| `gh` | GitHub CLI (board mutations, PR management) | [official install](https://cli.github.com/) | `brew install gh` |

### macOS one-shot install

```bash
brew install bash coreutils jq gh
```

The scripts include a defensive bash 4 re-exec guard at the top — if invoked under bash 3.2, they automatically re-exec via `/opt/homebrew/bin/bash` (or `/usr/local/bin/bash` on Intel Macs / Linuxbrew). If neither is found, they exit with a clear install hint.

### Linux

Distributions ship bash ≥ 4 and GNU `timeout` by default. No extra setup required.

---

## Running

| Skill | What it does | When |
|---|---|---|
| `/epic <N>` | Spawn `epic_loop.sh` in background on the listed epic IDs | Conception phase done, ready to dispatch tickets |
| `/code <N>` | Run a single ticket through `code-dev` (debug/fix mode, no loop) | Re-running a single failed ticket without the orchestrator |
| `/report [<N>...]` | Live dashboard of agents + sub-tickets state | Anytime |
| `/open <PR>` | Recreate a worktree for a given PR (post-`/epic` cleanup) | After auto-cleanup, when you want to test a PR locally |

`epic_loop.sh` should be invoked with **`unset CLAUDECODE`** when run from inside another Claude Code session — the spawned `claude` CLI refuses nested sessions otherwise.

```bash
( unset CLAUDECODE ; nohup bash scripts/orchestration/epic_loop.sh 3372 > /tmp/epic_loop_3372.log 2>&1 & disown )
```

---

## Files at a glance

| Script | Role |
|---|---|
| `epic_loop.sh` | Loop driver: per-tick cleanup → plan → spawn N sub-agents in parallel → aggregate JSON returns → process |
| `dispatch_plan.sh` | Compute the next-tick plan: parse `Depends on`, resolve stacked-PR base, allocate free indices |
| `process_tick_result.sh` | Apply board mutations + attempt-counter anti-loop based on the JSON verdict per ticket |
| `cleanup_terminal_worktrees.sh` | Tear down worktrees whose ticket reached `In review` / `Done` |
| `open_worktree.sh` | Recreate a worktree for a given PR number (skill `/open <PR>`) |
| `create_linked_branch.sh` | Create a GitHub-linked branch from an issue via `createLinkedBranch` GraphQL |
| `set_ticket_status.sh` | Move a ticket between board statuses (refuses `Done` — user-only) |
| `cache_gh.sh` | TTL-bounded `gh` cache to amortize rate limits |
| `log_event.sh` | Append-only per-agent event log |
| `epic_state.sh` | Compact tabular dump of an epic's sub-tickets state |
| `render_dashboard.sh` | Live dashboard for `/report` |

Each sub-script is `--help`-friendly via header comments.
