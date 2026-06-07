import {
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/**
 * Audit functional — extract a Playwright storageState from the logged-in
 * @playwright/mcp Chrome profile, so each parallel flow-runner can launch its
 * OWN isolated browser (`--isolated --storage-state <file>`) instead of sharing
 * one Chrome profile (whose SingletonLock serialises parallel runners).
 *
 * Auto-detects (override via env):
 *   - the logged-in profile: newest `~/.cache/ms-playwright/mcp-*` dir whose
 *     Default/Cookies references `localhost` (AUDIT_AUTH_PROFILE to force)
 *   - the chrome executable: newest `~/.cache/ms-playwright/chromium-*` build
 *     (AUDIT_CHROME_EXEC to force; empty → let Playwright pick its default)
 *
 * Usage: node scripts/audit-extract-auth.mjs <out-storage-state.json>
 * Exits non-zero (with a clear message) if no logged-in profile is found.
 */

const MS_PW = path.join(homedir(), ".cache", "ms-playwright");

function newestProfileWithLocalhost() {
	if (process.env.AUDIT_AUTH_PROFILE) return process.env.AUDIT_AUTH_PROFILE;
	if (!existsSync(MS_PW)) return null;
	const candidates = readdirSync(MS_PW)
		.filter((d) => d.startsWith("mcp-"))
		.map((d) => path.join(MS_PW, d))
		.filter((d) => existsSync(path.join(d, "Default", "Cookies")))
		.map((d) => {
			const cookies = path.join(d, "Default", "Cookies");
			let hasLocalhost = false;
			try {
				hasLocalhost = readFileSync(cookies).includes("localhost");
			} catch {}
			return { dir: d, mtime: statSync(cookies).mtimeMs, hasLocalhost };
		})
		.filter((c) => c.hasLocalhost)
		.sort((a, b) => b.mtime - a.mtime);
	return candidates[0]?.dir ?? null;
}

function newestChromeExecutable() {
	if (process.env.AUDIT_CHROME_EXEC !== undefined)
		return process.env.AUDIT_CHROME_EXEC || undefined;
	if (!existsSync(MS_PW)) return undefined;
	// Linux layout; Playwright falls back to its own default if this is absent.
	const builds = readdirSync(MS_PW)
		.filter((d) => /^chromium-\d+$/.test(d))
		.map((d) => ({ d, n: Number(d.split("-")[1]) }))
		.sort((a, b) => b.n - a.n);
	for (const { d } of builds) {
		const exe = path.join(MS_PW, d, "chrome-linux64", "chrome");
		if (existsSync(exe)) return exe;
	}
	return undefined;
}

async function main() {
	const out = process.argv[2];
	if (!out) {
		console.error("Usage: node scripts/audit-extract-auth.mjs <out.json>");
		process.exit(2);
	}
	const profile = newestProfileWithLocalhost();
	if (!profile) {
		console.error(
			"[audit-auth] No logged-in @playwright/mcp profile found (~/.cache/ms-playwright/mcp-* with a localhost cookie). Log in once to the local app via the Playwright MCP browser, then retry.",
		);
		process.exit(1);
	}
	const executablePath = newestChromeExecutable();
	let chromium;
	try {
		({ chromium } = await import("playwright"));
	} catch {
		({ chromium } = await import("@playwright/test"));
	}
	const ctx = await chromium.launchPersistentContext(profile, {
		headless: true,
		...(executablePath ? { executablePath } : {}),
	});
	try {
		const state = await ctx.storageState();
		writeFileSync(out, JSON.stringify(state));
		const local = state.cookies
			.filter((c) => (c.domain || "").includes("localhost"))
			.map((c) => c.name);
		const hasSession = local.some((n) => n.includes("session-token"));
		console.log(
			`[audit-auth] profile=${path.basename(profile)} → ${out} (${state.cookies.length} cookies, localhost: ${local.join(", ") || "none"})`,
		);
		if (!hasSession) {
			console.error(
				"[audit-auth] WARNING: no next-auth.session-token for localhost — runners may hit /login. Re-login locally and retry.",
			);
		}
	} finally {
		await ctx.close();
	}
}

await main();
