import type { Page } from "@playwright/test";
import {
	getCurrentDbYear,
	pushCampaignDeadlinesFarFuture,
	resetGipWorkforce,
	setCompanyHasCse,
	setGipWorkforce,
} from "./db";
import { resetCampaignYear as resetCampaignYearData } from "./db-campaign";

// Drives the campaign-year seam of issue #4022 from a Playwright run. The year
// is read by getCurrentYear() through globalThis.__egaproCampaignYear, a value
// that lives in TWO separate places: the Node server process (written by the
// guarded /api/e2e-clock route) and each browser bundle (written by an init
// script). Pinning a year deterministically therefore means writing both.

const CLOCK_ENDPOINT = "/api/e2e-clock";

function clockUrl(): string {
	const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
	return `${baseUrl}${CLOCK_ENDPOINT}`;
}

/**
 * Set (or clear) the campaign year on the SERVER surface only, via the guarded
 * /api/e2e-clock route. A number POSTs the override; null DELETEs it. Standalone
 * (takes no Page) so higher-level fixtures can reset server state between runs.
 */
export async function setServerCampaignYear(
	year: number | null,
): Promise<void> {
	const response =
		year === null
			? await fetch(clockUrl(), { method: "DELETE" })
			: await fetch(clockUrl(), {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ campaignYear: year }),
				});
	if (!response.ok) {
		throw new Error(
			`e2e-clock ${year === null ? "DELETE" : "POST"} returned ${response.status} — is the dev server running on :3000 with EGAPRO_E2E_CLOCK=true?`,
		);
	}
}

/**
 * Pin the campaign year on BOTH surfaces the app reads: the Node server (via the
 * route) and the browser bundle (via addInitScript, which runs before any page
 * script — so it also covers module-eval reads such as CompanyEditModal's
 * `const CURRENT_YEAR = getCurrentYear()`). Call before navigating the page.
 */
export async function pinCampaignYear(page: Page, year: number): Promise<void> {
	await setServerCampaignYear(year);
	await page.addInitScript((value) => {
		(globalThis as { __egaproCampaignYear?: number }).__egaproCampaignYear =
			value;
	}, year);
}

/**
 * Symmetric reset of {@link pinCampaignYear}: clear the server override and stop
 * injecting the browser one. addInitScript registrations are additive within a
 * Page, so this queues a delete that runs after any prior pin on the next
 * navigation; callers wanting a pristine browser context should open a new page.
 */
export async function resetCampaignYear(page: Page): Promise<void> {
	await setServerCampaignYear(null);
	await page.addInitScript(() => {
		(globalThis as { __egaproCampaignYear?: number }).__egaproCampaignYear =
			undefined;
	});
}

/** One campaign-year coordinate of the E2E grid (#4022): a pinned year and the
 * GIP workforce that decides the funnel shape (indicator G / step 5 gating). */
export type CampaignCoordinate = {
	page: Page;
	year: number;
	workforce: number;
};

/**
 * Run `fn` under a fully isolated campaign-year coordinate (#4067).
 *
 * Pins the clock on both surfaces, wipes any residue of the target year, seeds
 * its deadlines (never a `campaign_start_date` — see pushCampaignDeadlinesFarFuture),
 * its GIP workforce and its CSE answer, then runs the body. The teardown always
 * runs (even when `fn` throws) and double-resets: the coordinate's own year, plus
 * the calendar year as a safety net for any residue a default-year helper wrote
 * inside `fn` (`setCompanyHasCse`, an unpinned `setGipWorkforce`, …). The calendar
 * year is then restored to the baseline the unpinned suite depends on (far-future
 * deadlines + the >= 250 GIP workforce), so a pinned spec never leaves the shared
 * company GIP-less for the next spec file. It leaves no declaration, file, CSE
 * opinion, lock or `has_cse` flag of the coordinate behind — the invariant the
 * grid relies on to chain 185 coordinates without cross-contamination.
 *
 * `has_cse` gets its own re-seed on both ends because `resetCampaignYearData`
 * flattens it (it is not year-scoped) while, since #3952, the funnel layout
 * bounces to /mon-espace whenever the CSE answer is missing above the threshold:
 * without it a coordinate could no longer enter the funnel it pins, and would
 * leave the next spec file unable to enter it either. Coordinates that assert on
 * a specific answer still override it inside `fn`, as the grid fiches do.
 */
export async function withCampaignYear(
	coordinate: CampaignCoordinate,
	fn: () => Promise<void>,
): Promise<void> {
	const { page, year, workforce } = coordinate;
	await pinCampaignYear(page, year);
	await resetCampaignYearData(year);
	await pushCampaignDeadlinesFarFuture(year);
	await setGipWorkforce(workforce, year);
	await setCompanyHasCse(true);
	try {
		await fn();
	} finally {
		// Clear the SERVER clock override first: pinCampaignYear pins it on the Node
		// process (a global that survives across tests, unlike the per-page browser
		// init script), so without this every later unpinned spec would keep reading
		// this coordinate's year and lose its GIP row / funnel shape (#4067).
		await setServerCampaignYear(null);
		await resetCampaignYearData(year);
		const calendarYear = await getCurrentDbYear();
		if (calendarYear !== year) {
			await resetCampaignYearData(calendarYear);
			await pushCampaignDeadlinesFarFuture();
			await resetGipWorkforce();
		}
		await setCompanyHasCse(true);
	}
}
