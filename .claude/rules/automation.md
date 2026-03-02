---
description: Automated guardrails via hooks — always loaded
---

# Automated Guardrails

The following rules are enforced automatically by hooks in `.claude/settings.json`. You do not need to remember them — violations are blocked or auto-fixed.

## PreToolUse hooks (block before edit)

- **block-biome-ignore.sh** — Blocks any Edit/Write containing `biome-ignore`, `eslint-disable`, `@ts-ignore`, or `@ts-expect-error`. Fix the root cause instead.
- **block-inline-style.sh** — Blocks any Edit/Write adding `style={` or `<svg>` in `.tsx` files. Use DSFR classes / scoped SCSS module for styles, and `public/assets/*.svg` + `<img>` or DSFR icon classes for SVGs.

If a hook blocks your edit, do NOT attempt to bypass it. Rethink the approach.

## PostToolUse hooks (auto-fix after edit/run)

- **post-edit-lint.sh** (matcher: `Edit|Write`) — Runs `pnpm biome check --write` on every edited `.ts/.tsx/.js/.jsx/.json` file inside `packages/app/`. Formatting and lint fixes are applied automatically.
- **post-bash-lint.sh** (matcher: `Bash`) — After any `pnpm test|build|typecheck|lint|format|check` command, runs `pnpm biome check --write` on all git-modified `.ts/.tsx/.json` files. Acts as a safety net to catch formatting issues before CI.

Because of these hooks, you do NOT need to run `pnpm lint` or `pnpm format` manually. However, you still must run `pnpm typecheck` before considering a task complete.
