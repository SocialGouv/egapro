import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";
import { checkA11y } from "ultra11y/playwright";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..", "..", "..");
// Resolved from the dependency, not from a vendored copy: the engine is no longer committed
// to this repo. `ultra11y/scripts/ultra11y.mjs` is an explicit export of the package, so this
// resolves through pnpm's layout and cannot drift from the version the audit actually runs.
const ENGINE = createRequire(import.meta.url).resolve(
	"ultra11y/scripts/ultra11y.mjs",
);
const PAGE_ID = "integration-probe";
const SNAPSHOT_DIR = join(packageRoot, ".ultra11y/pages", PAGE_ID);

/**
 * The wiring probe.
 *
 * Every other spec in this directory records a page and asserts nothing (`failOn: false`) —
 * which is the point: the durable output is the snapshot, not the assertion. That makes a
 * silent breakage easy: if `ultra11y/playwright` stopped piping to the engine, the sweep
 * would still go green and the report would simply be empty.
 *
 * This spec is the one that fails loudly. It checks the full chain end to end: collect in
 * the browser → persist on disk → audit → re-audit offline.
 */
test.describe("intégration ultra11y ↔ Playwright", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(() => {
		rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
	});

	// The probe is a fixture, not a page of the service. Left on disk it would appear in the
	// RGAA sample as a page of its own — a duplicate of `mon-espace` under a made-up name,
	// inflating the page count of a conformance report.
	test.afterAll(() => {
		rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
	});

	test("checkA11y collecte, persiste et audite la page", async ({ page }) => {
		await page.goto("/mon-espace");
		await page.waitForLoadState("networkidle");

		const result = await checkA11y(page, {
			as: PAGE_ID,
			name: "Sonde d'intégration",
			sources: ["src/app/mon-espace/page.tsx"],
			auth: true,
			failOn: false,
		});

		// 1. The engine answered with a real AuditResult.
		expect(Array.isArray(result.findings)).toBe(true);

		// 2. The snapshot is on disk, with the signals only a browser has. Without these the
		//    page-scoped and rendered criteria (lang, title, computed contrast, focus
		//    visible) stay undecidable and the per-page grid is almost empty.
		for (const artefact of [
			"meta.json",
			"dom.html",
			"styles.json",
			"boxes.json",
			"screen.png",
		]) {
			expect(
				existsSync(join(SNAPSHOT_DIR, artefact)),
				`${artefact} manquant dans ${SNAPSHOT_DIR}`,
			).toBe(true);
		}

		// 3. The page identity is the one we asked for — that identity is the join key of
		//    the per-page grid, so a drift here silently mis-attributes every finding.
		const meta = JSON.parse(
			readFileSync(join(SNAPSHOT_DIR, "meta.json"), "utf-8"),
		);
		expect(meta.id).toBe(PAGE_ID);
		expect(meta.name).toBe("Sonde d'intégration");
		expect(meta.url).toContain("/mon-espace");

		// 4. It is a FULL document, not a component fragment. This is what makes RGAA 8.3
		//    (lang) and 8.5/8.6 (title) decidable at all.
		const dom = readFileSync(join(SNAPSHOT_DIR, "dom.html"), "utf-8");
		expect(dom).toContain("<html");
		expect(dom).toContain("</body>");

		// 5. The dev overlay PANEL must never be captured: it is DOM, and left in place it
		//    would audit itself and shift every document-order index. It detaches itself for
		//    the duration of the collection. (Its loader `<script>` legitimately stays — it
		//    is present throughout, so the digest and the DOM still agree on every index.)
		expect(dom).not.toContain('id="__ultra11y_overlay"');

		// 6. The style digest joined against the re-parsed DOM. On any mismatch the engine
		//    refuses the WHOLE digest rather than mis-attributing one element's colour to
		//    another — which would leave every rendering criterion undecided and silently
		//    hollow out the report.
		const styles = JSON.parse(
			readFileSync(join(SNAPSHOT_DIR, "styles.json"), "utf-8"),
		);
		expect(styles.entries.length).toBeGreaterThan(0);
		expect(styles.truncated).toBe(false);
	});

	test("le snapshot se rejoue hors navigateur", async () => {
		// The whole point of persisting a snapshot: CI decides the rendering criteria from a
		// recorded artefact, with no browser and no running app.
		const listed = execFileSync(
			"node",
			[ENGINE, "snapshot", "list", "--json"],
			{
				cwd: packageRoot,
				encoding: "utf-8",
			},
		);
		expect(listed).toContain(PAGE_ID);

		const audited = execFileSync(
			"node",
			[ENGINE, "audit", "src", "--jsx", "--graph", "--json"],
			{ cwd: packageRoot, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 },
		);
		const audit = JSON.parse(audited);
		const pages: string[] = (audit.scope?.pages ?? []).map(
			(p: { id: string }) => p.id,
		);
		expect(pages).toContain(PAGE_ID);
	});
});
