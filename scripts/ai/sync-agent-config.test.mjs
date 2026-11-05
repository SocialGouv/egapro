import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const wildcard = (glob) =>
	new RegExp(
		`^${glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")}$`,
	);

const claudePermissions = JSON.parse(read(".claude/settings.json")).permissions;
const claudeRules = (decision) =>
	claudePermissions[decision].map((rule) =>
		wildcard(rule.slice("Bash(".length, -1)),
	);

function claude(command) {
	for (const decision of ["deny", "ask"]) {
		if (claudeRules(decision).some((rule) => rule.test(command)))
			return decision;
	}
	return "allow";
}

const opencodeBash = Object.entries(
	JSON.parse(read("opencode.json")).permission.bash,
);

function opencode(command) {
	let decision = "allow";
	for (const [glob, value] of opencodeBash) {
		if (wildcard(glob).test(command)) decision = value;
	}
	return decision;
}

const codexRules = [
	...read(".codex/rules/egapro.rules").matchAll(
		/pattern = (\[.*?\]), decision = "(\w+)"/g,
	),
].map(([, pattern, decision]) => ({ pattern: JSON.parse(pattern), decision }));

function codex(command) {
	const tokens = command.split(" ");
	const matched = codexRules.filter(({ pattern }) =>
		pattern.every((token, i) => tokens[i] === token),
	);
	if (matched.some((rule) => rule.decision === "forbidden")) return "deny";
	return matched.length > 0 ? "ask" : "allow";
}

const everywhere = [
	["deny", "git commit --no-verify -m fix"],
	["deny", "git push --no-verify"],
	["deny", "git commit -n -m fix"],
	["deny", "git commit --no-gpg-sign -m fix"],
	["deny", "git -c commit.gpgsign=false commit -m fix"],
	["deny", "git -c commit.gpgSign=false commit -m fix"],
	["ask", "git push --force"],
	["ask", "git push --force-with-lease"],
	["ask", "git push -f"],
	["allow", "git commit -m fix"],
	["allow", "git push origin HEAD"],
	["allow", "git push -u origin chore-ai-tooling-agents-md"],
	["allow", "git status"],
	["allow", "git log --grep commit -n 5"],
	["allow", "git diff -- scripts/ai/sync-agent-config.mjs"],
];

const flagAfterArguments = [
	["deny", "git commit -m fix --no-verify"],
	["deny", "git commit -m fix -n"],
	["deny", "git commit -nm fix"],
	["deny", "git commit -m fix --no-gpg-sign"],
	["deny", "git -C packages/app commit --no-verify -m fix"],
	["deny", "git -C packages/app commit -m fix -n"],
	["deny", "git -c user.name=x commit -m fix --no-gpg-sign"],
	["ask", "git push origin HEAD --force-with-lease"],
	["ask", "git push origin HEAD --force"],
	["ask", "git push origin HEAD -f"],
	["ask", "git push --force-with-lease=refs/heads/demo:deadbeef origin HEAD"],
	["ask", "git push origin HEAD --force-with-lease=demo:deadbeef"],
	["ask", "git -C packages/app push origin HEAD --force"],
	["ask", "git -C packages/app push -f"],
];

for (const [name, decide] of [
	["Claude Code", claude],
	["OpenCode", opencode],
]) {
	test(`${name} command policy`, () => {
		for (const [want, command] of [...everywhere, ...flagAfterArguments]) {
			assert.equal(decide(command), want, command);
		}
	});
}

test("a denied flag wins over an ask flag in the same command, whatever the rule order", () => {
	const command = "git push origin HEAD --force --no-verify";
	assert.equal(claude(command), "deny");
	assert.equal(opencode(command), "deny");
});

test("Codex command policy covers the flag directly after the subcommand", () => {
	for (const [want, command] of everywhere) {
		assert.equal(codex(command), want, command);
	}
});

test("MCP servers do not depend on the directory the tool is launched from", () => {
	const args = JSON.parse(read(".mcp.json")).mcpServers.ultra11y.args;
	assert.ok(
		!args.includes("--dir"),
		"pnpm --dir <relative path> resolves against the launch directory",
	);
	assert.deepEqual(args.slice(0, 3), ["--filter", "app", "exec"]);
	assert.match(
		read(".codex/config.toml"),
		/args = \["--filter", "app", "exec", "ultra11y", "mcp"\]/,
	);
	assert.deepEqual(
		JSON.parse(read("opencode.json")).mcp.ultra11y.command.slice(1, 4),
		["--filter", "app", "exec"],
	);
});
