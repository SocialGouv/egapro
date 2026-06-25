// Visual fidelity probe — deterministic render + DOM measurement + onion-skin overlay.
//
// Used by the `design-validator` agent (see .claude/agents/design-validator/AGENT.md).
// It is NOT part of the app build; it drives a Playwright browser against a running
// dev server to produce, for one screen scenario:
//   - a cropped screenshot per viewport (the "rendered" side of the comparison)
//   - numeric DOM measurements (computed box / font / colour, text width, vertical
//     gaps between elements) so fidelity is checked against numbers, not eyeballed
// and, in overlay mode, an onion-skin composite of the rendered screenshot over the
// Figma node export so positional drift shows as ghosting regardless of its cause.
//
// Usage:
//   node scripts/visual-fidelity-probe.mjs --config <scenario.json> --out <dir> [--base-url http://localhost:3000]
//   node scripts/visual-fidelity-probe.mjs --overlay --a <render.png> --b <figma.png> --out <overlay.png> [--opacity 0.5]
//
// Scenario JSON shape (probe mode):
//   {
//     "name": "declaration-process-panel-closed",
//     "url": "/test-panel",
//     "viewports": [[1280, 1024], [1280, 760]],
//     "setup": [
//       { "action": "check", "selector": "#variant-closed", "force": true },
//       { "action": "click", "role": "button", "name": "Ouvrir le panel" },
//       { "action": "evaluate", "fn": "() => { const d = document.getElementById('x'); d?.showModal?.(); }" },
//       { "action": "wait", "ms": 300 }
//     ],
//     "clip": "#declaration-process-panel [class*=\"panelContainer\"]",
//     "measures": [
//       { "name": "closedMessage", "selector": "#declaration-process-panel [class*=\"closedMessage\"]" },
//       { "name": "separator", "selector": "#declaration-process-panel hr" },
//       { "name": "helpLinks", "selector": "#declaration-process-panel [class*=\"helpLinks\"] button", "all": true, "text": true }
//     ],
//     "gaps": [["closedMessage", "separator"]]
//   }

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { chromium } from "@playwright/test";

function parseArgs(argv) {
	const args = {};
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (!token.startsWith("--")) continue;
		const key = token.slice(2);
		const next = argv[i + 1];
		if (next === undefined || next.startsWith("--")) {
			args[key] = true;
		} else {
			args[key] = next;
			i++;
		}
	}
	return args;
}

const measureInPage = `(targets) => {
	const box = (el) => {
		if (!el) return null;
		const r = el.getBoundingClientRect();
		return {
			x: Math.round(r.x), y: Math.round(r.y),
			w: Math.round(r.width), h: Math.round(r.height),
			top: Math.round(r.top), bottom: Math.round(r.bottom),
		};
	};
	const textWidth = (el) => {
		if (!el) return null;
		const range = document.createRange();
		range.selectNodeContents(el);
		return Math.round(range.getBoundingClientRect().width);
	};
	const style = (el) => {
		if (!el) return null;
		const cs = getComputedStyle(el);
		return {
			display: cs.display,
			alignSelf: cs.alignSelf,
			color: cs.color,
			backgroundColor: cs.backgroundColor,
			fontSize: cs.fontSize,
			fontWeight: cs.fontWeight,
			lineHeight: cs.lineHeight,
			marginTop: cs.marginTop,
			marginBottom: cs.marginBottom,
			paddingTop: cs.paddingTop,
			paddingBottom: cs.paddingBottom,
			backgroundSize: cs.backgroundSize,
			textDecorationLine: cs.textDecorationLine,
		};
	};
	const describe = (el) => {
		if (!el) return null;
		const out = { box: box(el), style: style(el) };
		out.textWidth = textWidth(el);
		out.overhang = out.box && out.textWidth != null ? out.box.w - out.textWidth : null;
		return out;
	};

	const result = {};
	for (const t of targets) {
		if (t.all) {
			const els = [...document.querySelectorAll(t.selector)];
			result[t.name] = els.map((el) => ({ label: el.textContent.trim(), ...describe(el) }));
		} else {
			result[t.name] = describe(document.querySelector(t.selector));
		}
	}
	return result;
}`;

async function runSetup(page, setup) {
	for (const step of setup ?? []) {
		switch (step.action) {
			case "check":
				await page.locator(step.selector).check({ force: Boolean(step.force) });
				break;
			case "click":
				if (step.role) {
					await page.getByRole(step.role, { name: step.name }).click();
				} else {
					await page.locator(step.selector).click();
				}
				break;
			case "fill":
				await page.locator(step.selector).fill(step.value);
				break;
			case "evaluate":
				await page.evaluate(`(${step.fn})()`);
				break;
			case "wait":
				await page.waitForTimeout(step.ms ?? 300);
				break;
			default:
				throw new Error(`Unknown setup action: ${step.action}`);
		}
	}
}

async function probe(args) {
	const config = JSON.parse(await readFile(args.config, "utf8"));
	const baseUrl = args["base-url"] ?? "http://localhost:3000";
	const out = args.out ?? ".";
	await mkdir(out, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const perViewport = [];

	for (const [width, height] of config.viewports ?? [[1280, 1024]]) {
		const ctx = await browser.newContext({
			viewport: { width, height },
			deviceScaleFactor: 2,
		});
		const page = await ctx.newPage();
		await page.goto(baseUrl + (config.url ?? "/"), {
			waitUntil: "networkidle",
		});
		await runSetup(page, config.setup);
		await page.waitForTimeout(200);

		const measures = await page.evaluate(
			`(${measureInPage})(${JSON.stringify(config.measures ?? [])})`,
		);

		const gaps = {};
		for (const [a, b] of config.gaps ?? []) {
			const ra = measures[a];
			const rb = measures[b];
			gaps[`${a}->${b}`] =
				ra?.box && rb?.box ? rb.box.top - ra.box.bottom : null;
		}

		const shotPath = `${out}/${config.name}-h${height}.png`;
		const clip = config.clip ? await page.$(config.clip) : null;
		if (clip) {
			await clip.screenshot({ path: shotPath });
		} else {
			await page.screenshot({
				path: shotPath,
				fullPage: Boolean(config.fullPage),
			});
		}

		perViewport.push({
			viewport: { width, height },
			screenshot: shotPath,
			gaps,
			measures,
		});
		await ctx.close();
	}

	await browser.close();
	const report = {
		name: config.name,
		url: config.url,
		baseUrl,
		viewports: perViewport,
	};
	const reportPath = `${out}/${config.name}.json`;
	await writeFile(reportPath, JSON.stringify(report, null, 2));
	console.log(JSON.stringify(report, null, 2));
	console.error(`\nReport: ${reportPath}`);
}

async function overlay(args) {
	const opacity = Number(args.opacity ?? 0.5);
	const outPath = args.out ?? "overlay.png";
	await mkdir(dirname(outPath), { recursive: true });
	const aData = `data:image/png;base64,${(await readFile(args.a)).toString("base64")}`;
	const bData = `data:image/png;base64,${(await readFile(args.b)).toString("base64")}`;

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	const dataUrl = await page.evaluate(
		async ({ aSrc, bSrc, alpha }) => {
			const load = (src) =>
				new Promise((resolve, reject) => {
					const img = new Image();
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = src;
				});
			const [a, b] = await Promise.all([load(aSrc), load(bSrc)]);
			const width = Math.max(a.naturalWidth, b.naturalWidth);
			const scale = (img) => width / img.naturalWidth;
			const height = Math.max(
				a.naturalHeight * scale(a),
				b.naturalHeight * scale(b),
			);
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = Math.ceil(height);
			const ctx = canvas.getContext("2d");
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalAlpha = 1;
			ctx.drawImage(a, 0, 0, width, a.naturalHeight * scale(a));
			ctx.globalAlpha = alpha;
			ctx.drawImage(b, 0, 0, width, b.naturalHeight * scale(b));
			return canvas.toDataURL("image/png");
		},
		{ aSrc: aData, bSrc: bData, alpha: opacity },
	);
	await browser.close();

	const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
	await writeFile(outPath, Buffer.from(base64, "base64"));
	console.error(`Overlay written: ${outPath}`);
}

const args = parseArgs(process.argv.slice(2));
if (args.overlay) {
	await overlay(args);
} else if (args.config) {
	await probe(args);
} else {
	console.error(
		"Usage:\n  node scripts/visual-fidelity-probe.mjs --config <scenario.json> --out <dir> [--base-url http://localhost:3000]\n  node scripts/visual-fidelity-probe.mjs --overlay --a <render.png> --b <figma.png> --out <overlay.png> [--opacity 0.5]",
	);
	process.exit(2);
}
