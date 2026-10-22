/**
 * Campaign clock override (issue #4022), for tests and recette environments
 * only — the single place that touches the `__egaproCampaignYear` global.
 * `getCurrentYear()` consults it so the E2E recette grid, or a manual recette
 * environment, can pilot the campaign year (2027 → 2033) while the calendar
 * says otherwise.
 *
 * Why a global, of all things: the override must reach the Node server (~43
 * call sites: RSC pages, API routes, tRPC) AND the browser bundle (~13 client
 * call sites) with per-test granularity and no rebuild. `globalThis` is the
 * only namespace both surfaces share — the process global in Node, shared by
 * route handlers and Server Components alike, and `window` in the browser. An
 * env var cannot do this: direct env reads are forbidden outside env.js by the
 * repo hook and offer no per-test granularity, a `NEXT_PUBLIC_` var is inlined
 * at build time (one build per tested year), and Playwright's `page.clock`
 * never reaches the server.
 *
 * Who writes it, server-side — two writers, both unreachable in production:
 * - the /api/e2e-clock route, gated by `EGAPRO_E2E_CLOCK` — declared in no
 *   .kontinuous env config, so the route 404s in preproduction and production;
 * - `instrumentation.ts`, once at boot, when `EGAPRO_RECETTE_CAMPAIGN_YEAR`
 *   pins the year of a manual recette environment. env.js refuses to start
 *   when that variable is set on a non-dev build, and it is declared in no
 *   .kontinuous config either: only the promote-test-env workflow sets it.
 *   The pin lives in the process global, so it applies to every user of that
 *   environment at once. The CronJobs and the notifications worker run in
 *   other processes and keep the real calendar year.
 *
 * Browser-side, the same key is set on `window` as a literal (a serialized
 * script cannot import this module): by the Playwright fixture's
 * `addInitScript`, and by the root layout's `campaign-year-init` script when
 * the recette variable is set.
 * A user setting the key in their own production console only alters their own
 * display — every mutation recomputes the year server-side. Security-reviewed
 * on the epic: display-only impact, accepted.
 */

type CampaignClockGlobal = { __egaproCampaignYear?: number };

const clockGlobal = globalThis as CampaignClockGlobal;

/** The pinned campaign year, or null when no recette run pinned one. */
export function readCampaignYearOverride(): number | null {
	const override = clockGlobal.__egaproCampaignYear;
	return typeof override === "number" ? override : null;
}

export function writeCampaignYearOverride(year: number): void {
	clockGlobal.__egaproCampaignYear = year;
}

export function clearCampaignYearOverride(): void {
	delete clockGlobal.__egaproCampaignYear;
}
