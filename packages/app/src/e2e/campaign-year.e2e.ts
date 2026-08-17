import { expect, test } from "@playwright/test";

import {
	pinCampaignYear,
	setServerCampaignYear,
} from "./helpers/campaign-year";

// Tooling coverage for the campaign-clock seam (issue #4022): getCurrentYear()
// honours globalThis.__egaproCampaignYear on both the Node server and the
// browser bundle. The two 404 lock-outs (flag absent / NODE_ENV=production) are
// already covered as unit tests in src/app/api/e2e-clock/__tests__/route.test.ts,
// so they are deliberately not duplicated here.

const SERVER_PINNED_YEAR = 2030;
const PINNED_YEAR = 2029;

test.describe("Campaign clock — pilotable campaign year", () => {
	test.describe.configure({ mode: "serial" });

	// Clear the process-wide server override so later E2E files see the calendar
	// year again (workers:1 shares one Node process across every spec).
	test.afterEach(async () => {
		await setServerCampaignYear(null);
	});

	test("POST /api/e2e-clock pins the year read by a server-rendered page", async ({
		page,
	}) => {
		await setServerCampaignYear(SERVER_PINNED_YEAR);

		// /admin/stats builds its campaign-year list server-side from
		// getCurrentYear(); a checkbox for a future year can only exist if the
		// Server Component observed the override.
		await page.goto("/admin/stats");
		await expect(
			page.getByRole("checkbox", {
				exact: true,
				name: `${SERVER_PINNED_YEAR}`,
			}),
		).toBeVisible();
	});

	test("pinCampaignYear fixes the year on both the server and the browser surface", async ({
		page,
	}) => {
		await pinCampaignYear(page, PINNED_YEAR);

		// Server surface: CompanyInfoBanner is a Server Component whose workforce
		// label is rendered from the server-side getWorkforceYear() = N-1, so a
		// campaign pinned on PINNED_YEAR shows the prior calendar year.
		await page.goto("/mon-espace");
		await expect(
			page.locator("dl").filter({ hasText: "Effectif annuel moyen" }).first(),
		).toContainText(`Effectif annuel moyen en ${PINNED_YEAR - 1} :`);

		// Browser surface: the campaign-year <select> lists years up to
		// getCurrentYear() + 10, computed inside a client component. The pinned
		// year's +10 option can only exist if the browser bundle read the injected
		// override (otherwise hydration would recompute it from the system clock).
		await page.goto("/admin/parametres");
		await expect(page.locator("#campaign-year-selector")).toContainText(
			`${PINNED_YEAR + 10}`,
		);
	});

	test("DELETE /api/e2e-clock reverts the year to the system clock", async ({
		request,
	}) => {
		const calendarYear = (await (await request.get("/api/e2e-clock")).json())
			.campaignYear;

		await setServerCampaignYear(SERVER_PINNED_YEAR);
		expect(
			(await (await request.get("/api/e2e-clock")).json()).campaignYear,
		).toBe(SERVER_PINNED_YEAR);

		await setServerCampaignYear(null);
		expect(
			(await (await request.get("/api/e2e-clock")).json()).campaignYear,
		).toBe(calendarYear);
	});
});
