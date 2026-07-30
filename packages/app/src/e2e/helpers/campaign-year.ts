import type { Page } from "@playwright/test";

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
