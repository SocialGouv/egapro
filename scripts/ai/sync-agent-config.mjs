#!/usr/bin/env node
// Generates OpenCode's and Codex's MCP config from the root `.mcp.json`, the one file to edit.
//
// There is no cross-tool standard for MCP servers. `.mcp.json` (read as-is by Claude Code, and the
// de-facto format of most MCP clients) is the source; OpenCode reads the `mcp` key of
// `opencode.json`, Codex the `[mcp_servers.*]` tables of `.codex/config.toml`. Hand-kept copies of
// one list drift; this script makes them outputs.
//
//   node scripts/ai/sync-agent-config.mjs           rewrite the generated files
//   node scripts/ai/sync-agent-config.mjs --check   exit 1 if any of them is stale (CI, pnpm verify)

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const check = process.argv.includes("--check");
const { mcpServers: servers } = JSON.parse(readFileSync(join(root, ".mcp.json"), "utf8"));

const json = (value) => `${JSON.stringify(value, null, "\t")}\n`;
const toml = (value) => JSON.stringify(value);

function opencode(current) {
	const mcp = {};
	for (const [name, s] of Object.entries(servers)) {
		mcp[name] = s.url ? { type: "remote", url: s.url } : { type: "local", command: [s.command, ...(s.args ?? [])] };
	}
	const config = current ? JSON.parse(current) : { $schema: "https://opencode.ai/config.json" };
	return json({ ...config, mcp });
}

function codex() {
	const lines = ["# Généré par scripts/ai/sync-agent-config.mjs depuis .mcp.json — ne pas éditer.", ""];
	for (const [name, s] of Object.entries(servers)) {
		lines.push(`[mcp_servers.${name}]`);
		if (s.url) lines.push(`url = ${toml(s.url)}`);
		else lines.push(`command = ${toml(s.command)}`, `args = [${(s.args ?? []).map(toml).join(", ")}]`);
		lines.push("");
	}
	return lines.join("\n");
}

const read = (file) => (existsSync(join(root, file)) ? readFileSync(join(root, file), "utf8") : null);
const targets = {
	"opencode.json": opencode(read("opencode.json")),
	".codex/config.toml": codex(),
};

let stale = 0;
for (const [file, content] of Object.entries(targets)) {
	if (read(file) === content) continue;
	if (check) {
		console.error(`✗ ${file} is out of date with .mcp.json — run: node scripts/ai/sync-agent-config.mjs`);
		stale++;
	} else {
		writeFileSync(join(root, file), content);
		console.log(`wrote ${file}`);
	}
}
if (check && stale === 0) console.log("agent config: in sync with .mcp.json");
process.exit(stale ? 1 : 0);
