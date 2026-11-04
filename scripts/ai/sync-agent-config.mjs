#!/usr/bin/env node
// Keeps Claude Code, OpenCode and Codex on the same agent config: same MCP servers, same refused
// commands. Each tool insists on its own file and format, so this script owns those parts of them.
//
//   MCP servers   source: the root `.mcp.json` (read as-is by Claude Code, the de-facto MCP format)
//                 → `mcp` of `opencode.json`, `[mcp_servers.*]` of `.codex/config.toml`
//   command policy  source: POLICY below
//                 → `permissions` of `.claude/settings.json`, `permission.bash` of `opencode.json`,
//                   `.codex/rules/egapro.rules`
//
//   node scripts/ai/sync-agent-config.mjs           rewrite the generated parts
//   node scripts/ai/sync-agent-config.mjs --check   exit 1 if any of them is stale (CI, pnpm verify)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Commands an agent must never run (deny) or must confirm with the user first (ask).
// `glob` is matched against the whole command line by Claude Code and OpenCode; Codex only
// matches token prefixes, so `codex` lists the prefixes that cover the usual spellings.
// The git hooks are the barrier; these rules stop an agent from switching them off.
const POLICY = [
	{ decision: "deny", glob: "*--no-verify*", codex: [["git", "commit", "--no-verify"], ["git", "push", "--no-verify"]] },
	{ decision: "deny", glob: "git commit -n*", codex: [["git", "commit", "-n"]] },
	{ decision: "deny", glob: "*--no-gpg-sign*", codex: [["git", "commit", "--no-gpg-sign"]] },
	{ decision: "deny", glob: "*commit.gpgsign=false*", codex: [["git", "-c", "commit.gpgsign=false"]] },
	{ decision: "deny", glob: "*commit.gpgSign=false*", codex: [["git", "-c", "commit.gpgSign=false"]] },
	{ decision: "ask", glob: "git push --force*", codex: [["git", "push", "--force"], ["git", "push", "--force-with-lease"]] },
	{ decision: "ask", glob: "git push -f*", codex: [["git", "push", "-f"]] },
];

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const check = process.argv.includes("--check");
const read = (file) => (existsSync(join(root, file)) ? readFileSync(join(root, file), "utf8") : null);
const { mcpServers: servers } = JSON.parse(read(".mcp.json"));

const json = (value, indent) => `${JSON.stringify(value, null, indent)}\n`;
const toml = (value) => JSON.stringify(value);

function claudeSettings(current) {
	const config = current ? JSON.parse(current) : {};
	const rules = (decision) => POLICY.filter((p) => p.decision === decision).map((p) => `Bash(${p.glob})`);
	return json({ ...config, permissions: { ...config.permissions, deny: rules("deny"), ask: rules("ask") } }, 2);
}

function opencode(current) {
	const mcp = {};
	for (const [name, s] of Object.entries(servers)) {
		mcp[name] = s.url ? { type: "remote", url: s.url } : { type: "local", command: [s.command, ...(s.args ?? [])] };
	}
	const config = current ? JSON.parse(current) : { $schema: "https://opencode.ai/config.json" };
	const bash = Object.fromEntries(POLICY.map((p) => [p.glob, p.decision]));
	return json({ ...config, mcp, permission: { ...config.permission, bash } }, "\t");
}

function codexConfig() {
	const lines = ["# Généré par scripts/ai/sync-agent-config.mjs depuis .mcp.json — ne pas éditer.", ""];
	for (const [name, s] of Object.entries(servers)) {
		lines.push(`[mcp_servers.${name}]`);
		if (s.url) lines.push(`url = ${toml(s.url)}`);
		else lines.push(`command = ${toml(s.command)}`, `args = [${(s.args ?? []).map(toml).join(", ")}]`);
		lines.push("");
	}
	return lines.join("\n");
}

function codexRules() {
	const decision = { deny: "forbidden", ask: "prompt" };
	const lines = ["# Généré par scripts/ai/sync-agent-config.mjs (POLICY) — ne pas éditer.", ""];
	for (const p of POLICY) {
		for (const prefix of p.codex) {
			lines.push(
				`prefix_rule(pattern = ${toml(prefix)}, decision = ${toml(decision[p.decision])}, justification = ${toml(`egapro: ${p.glob} (${p.decision})`)})`,
			);
		}
	}
	return `${lines.join("\n")}\n`;
}

const targets = {
	".claude/settings.json": claudeSettings(read(".claude/settings.json")),
	"opencode.json": opencode(read("opencode.json")),
	".codex/config.toml": codexConfig(),
	".codex/rules/egapro.rules": codexRules(),
};

let stale = 0;
for (const [file, content] of Object.entries(targets)) {
	if (read(file) === content) continue;
	if (check) {
		console.error(`✗ ${file} is out of date — run: node scripts/ai/sync-agent-config.mjs`);
		stale++;
	} else {
		mkdirSync(dirname(join(root, file)), { recursive: true });
		writeFileSync(join(root, file), content);
		console.log(`wrote ${file}`);
	}
}
if (check && stale === 0) console.log("agent config: Claude Code, OpenCode and Codex in sync");
process.exit(stale ? 1 : 0);
