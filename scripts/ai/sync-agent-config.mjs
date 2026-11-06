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

// Commands an agent must never run (deny) or must confirm first (ask). `globs` match the whole
// command line (Claude Code, OpenCode); Codex only matches token prefixes (`codex`, see AGENTS.md).
// The git hooks are the barrier; these rules stop an agent from switching them off.
const gitFlag = (subcommand, flag) =>
	["git", "git -*"].map((git) => `${git} ${subcommand}* ${flag}*`);

const POLICY = [
	{
		decision: "deny",
		reason: "--no-verify",
		globs: ["*--no-verify*"],
		codex: [
			["git", "commit", "--no-verify"],
			["git", "push", "--no-verify"],
		],
	},
	{
		decision: "deny",
		reason: "git commit -n",
		globs: gitFlag("commit", "-n"),
		codex: [["git", "commit", "-n"]],
	},
	{
		decision: "deny",
		reason: "--no-gpg-sign",
		globs: ["*--no-gpg-sign*"],
		codex: [["git", "commit", "--no-gpg-sign"]],
	},
	{
		decision: "deny",
		reason: "commit.gpgsign=false",
		globs: ["*commit.gpgsign=false*", "*commit.gpgSign=false*"],
		codex: [
			["git", "-c", "commit.gpgsign=false"],
			["git", "-c", "commit.gpgSign=false"],
		],
	},
	{
		decision: "ask",
		reason: "git push --force",
		globs: gitFlag("push", "--force"),
		codex: [
			["git", "push", "--force"],
			["git", "push", "--force-with-lease"],
		],
	},
	{
		decision: "ask",
		reason: "git push -f",
		globs: gitFlag("push", "-f"),
		codex: [["git", "push", "-f"]],
	},
];

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const check = process.argv.includes("--check");
const read = (file) =>
	existsSync(join(root, file)) ? readFileSync(join(root, file), "utf8") : null;
const { mcpServers: servers } = JSON.parse(read(".mcp.json"));

const json = (value, indent) => `${JSON.stringify(value, null, indent)}\n`;
const toml = (value) => JSON.stringify(value);

function claudeSettings(current) {
	const config = current ? JSON.parse(current) : {};
	const rules = (decision) =>
		POLICY.filter((p) => p.decision === decision).flatMap((p) =>
			p.globs.map((glob) => `Bash(${glob})`),
		);
	return json(
		{
			...config,
			permissions: {
				...config.permissions,
				deny: rules("deny"),
				ask: rules("ask"),
			},
		},
		2,
	);
}

function opencode(current) {
	const mcp = {};
	for (const [name, s] of Object.entries(servers)) {
		mcp[name] = s.url
			? { type: "remote", url: s.url }
			: { type: "local", command: [s.command, ...(s.args ?? [])] };
	}
	const config = current
		? JSON.parse(current)
		: { $schema: "https://opencode.ai/config.json" };
	const bash = Object.fromEntries(
		["ask", "deny"].flatMap((decision) =>
			POLICY.filter((p) => p.decision === decision).flatMap((p) =>
				p.globs.map((glob) => [glob, decision]),
			),
		),
	);
	return json(
		{ ...config, mcp, permission: { ...config.permission, bash } },
		"\t",
	);
}

function codexConfig() {
	const lines = [
		"# Généré par scripts/ai/sync-agent-config.mjs depuis .mcp.json — ne pas éditer.",
		"",
	];
	for (const [name, s] of Object.entries(servers)) {
		lines.push(`[mcp_servers.${name}]`);
		if (s.url) lines.push(`url = ${toml(s.url)}`);
		else
			lines.push(
				`command = ${toml(s.command)}`,
				`args = [${(s.args ?? []).map(toml).join(", ")}]`,
			);
		lines.push("");
	}
	return lines.join("\n");
}

function codexRules() {
	const decision = { deny: "forbidden", ask: "prompt" };
	const lines = [
		"# Généré par scripts/ai/sync-agent-config.mjs (POLICY) — ne pas éditer.",
		"",
	];
	for (const p of POLICY) {
		for (const prefix of p.codex) {
			lines.push(
				`prefix_rule(pattern = ${toml(prefix)}, decision = ${toml(decision[p.decision])}, justification = ${toml(`egapro: ${p.reason} (${p.decision})`)})`,
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
		console.error(
			`✗ ${file} is out of date — run: node scripts/ai/sync-agent-config.mjs`,
		);
		stale++;
	} else {
		mkdirSync(dirname(join(root, file)), { recursive: true });
		writeFileSync(join(root, file), content);
		console.log(`wrote ${file}`);
	}
}
if (check && stale === 0)
	console.log("agent config: Claude Code, OpenCode and Codex in sync");
process.exit(stale ? 1 : 0);
