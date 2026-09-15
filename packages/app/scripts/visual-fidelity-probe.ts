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
// Security model: this is a trusted local dev tool. The scenario JSON is authored by
// the `design-validator` agent (never end-user input) and runs only against an
// ephemeral local dev server. The `evaluate` setup action and the `measures` selectors
// are therefore executed as-is in the page context; do not feed it untrusted JSON.
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

import type { Page } from "@playwright/test";
import { chromium } from "@playwright/test";

type CliArgs = Record<string, string | true>;

type Role = Parameters<Page["getByRole"]>[0];

type SetupStep =
	| { action: "check"; selector: string; force?: boolean }
	| { action: "click"; role: Role; name?: string; selector?: undefined }
	| { action: "click"; role?: undefined; selector: string }
	| { action: "fill"; selector: string; value: string }
	| { action: "evaluate"; fn: string }
	| { action: "wait"; ms?: number };

interface MeasureTarget {
	name: string;
	selector: string;
	all?: boolean;
	text?: boolean;
}

interface ProbeConfig {
	name: string;
	url?: string;
	viewports?: [number, number][];
	setup?: SetupStep[];
	clip?: string;
	fullPage?: boolean;
	measures?: MeasureTarget[];
	gaps?: [string, string][];
}

interface MeasuredBox {
	x: number;
	y: number;
	w: number;
	h: number;
	top: number;
	bottom: number;
}

interface MeasuredStyle {
	display: string;
	alignSelf: string;
	color: string;
	backgroundColor: string;
	fontSize: string;
	fontWeight: string;
	lineHeight: string;
	marginTop: string;
	marginBottom: string;
	paddingTop: string;
	paddingBottom: string;
	backgroundSize: string;
	textDecorationLine: string;
}

interface MeasuredElement {
	box: MeasuredBox | null;
	style: MeasuredStyle | null;
	textWidth: number | null;
	overhang: number | null;
}

type LabelledMeasuredElement = MeasuredElement & { label: string };

type MeasureResults = Record<
	string,
	MeasuredElement | LabelledMeasuredElement[] | null
>;

interface ViewportReport {
	viewport: { width: number; height: number };
	screenshot: string;
	gaps: Record<string, number | null>;
	measures: MeasureResults;
}

function parseArgs(argv: string[]): CliArgs {
	const args: CliArgs = {};
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (token === undefined || !token.startsWith("--")) continue;
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

function stringArg(args: CliArgs, key: string): string | undefined {
	const value = args[key];
	return typeof value === "string" ? value : undefined;
}

function requiredStringArg(args: CliArgs, key: string): string {
	const value = stringArg(args, key);
	if (value === undefined) {
		throw new Error(`Missing value for --${key}`);
	}
	return value;
}

const measureInPage = (targets: MeasureTarget[]): MeasureResults => {
	const box = (el: Element | null): MeasuredBox | null => {
		if (!el) return null;
		const r = el.getBoundingClientRect();
		return {
			x: Math.round(r.x),
			y: Math.round(r.y),
			w: Math.round(r.width),
			h: Math.round(r.height),
			top: Math.round(r.top),
			bottom: Math.round(r.bottom),
		};
	};
	const textWidth = (el: Element | null): number | null => {
		if (!el) return null;
		const range = document.createRange();
		range.selectNodeContents(el);
		return Math.round(range.getBoundingClientRect().width);
	};
	const style = (el: Element | null): MeasuredStyle | null => {
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
	const describe = (el: Element): MeasuredElement => {
		const elBox = box(el);
		const elTextWidth = textWidth(el);
		return {
			box: elBox,
			style: style(el),
			textWidth: elTextWidth,
			overhang: elBox && elTextWidth != null ? elBox.w - elTextWidth : null,
		};
	};
	const describeOrNull = (el: Element | null): MeasuredElement | null =>
		el ? describe(el) : null;

	const result: MeasureResults = {};
	for (const t of targets) {
		if (t.all) {
			const els = [...document.querySelectorAll(t.selector)];
			result[t.name] = els.map((el) => ({
				label: (el.textContent ?? "").trim(),
				...describe(el),
			}));
		} else {
			result[t.name] = describeOrNull(document.querySelector(t.selector));
		}
	}
	return result;
};

async function runSetup(page: Page, setup: SetupStep[] | undefined) {
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
			default: {
				const { action } = step as { action: string };
				throw new Error(`Unknown setup action: ${action}`);
			}
		}
	}
}

function boxOf(
	entry: MeasuredElement | LabelledMeasuredElement[] | null | undefined,
): MeasuredBox | null {
	if (!entry || Array.isArray(entry)) return null;
	return entry.box;
}

async function probe(args: CliArgs) {
	const config: ProbeConfig = JSON.parse(
		await readFile(requiredStringArg(args, "config"), "utf8"),
	);
	const baseUrl = stringArg(args, "base-url") ?? "http://localhost:3000";
	const out = stringArg(args, "out") ?? ".";
	await mkdir(out, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const perViewport: ViewportReport[] = [];
	const viewports: [number, number][] = config.viewports ?? [[1280, 1024]];

	for (const [width, height] of viewports) {
		const ctx = await browser.newContext({
			viewport: { width, height },
			deviceScaleFactor: 2,
		});
		const page = await ctx.newPage();
		await page.goto(baseUrl + (config.url ?? "/"), {
			waitUntil: "load",
		});
		await runSetup(page, config.setup);
		await page.waitForTimeout(200);

		const measures = await page.evaluate(measureInPage, config.measures ?? []);

		const gaps: Record<string, number | null> = {};
		for (const [a, b] of config.gaps ?? []) {
			const ra = boxOf(measures[a]);
			const rb = boxOf(measures[b]);
			gaps[`${a}->${b}`] = ra && rb ? rb.top - ra.bottom : null;
		}

		const shotPath = `${out}/${config.name}-h${height}.png`;
		const clip = config.clip ? await page.$(config.clip) : null;
		if (config.clip && !clip) {
			throw new Error(`clip selector not found: ${config.clip}`);
		}
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

async function overlay(args: CliArgs) {
	const opacity = Number(args.opacity ?? 0.5);
	const outPath = stringArg(args, "out") ?? "overlay.png";
	await mkdir(dirname(outPath), { recursive: true });
	const aData = `data:image/png;base64,${(await readFile(requiredStringArg(args, "a"))).toString("base64")}`;
	const bData = `data:image/png;base64,${(await readFile(requiredStringArg(args, "b"))).toString("base64")}`;

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	const dataUrl = await page.evaluate(
		async ({
			aSrc,
			bSrc,
			alpha,
		}: {
			aSrc: string;
			bSrc: string;
			alpha: number;
		}) => {
			const load = (src: string) =>
				new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image();
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = src;
				});
			const [a, b] = await Promise.all([load(aSrc), load(bSrc)]);
			const width = Math.max(a.naturalWidth, b.naturalWidth);
			const scale = (img: HTMLImageElement) => width / img.naturalWidth;
			const height = Math.max(
				a.naturalHeight * scale(a),
				b.naturalHeight * scale(b),
			);
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = Math.ceil(height);
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Unable to get a 2d canvas context");
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
