import { expect, test } from "@playwright/test";

import { deleteReferents, seedReferents } from "./helpers/db-campaign";

// Cross-system journeys only: anonymous access, region-filter + access-control,
// the click-through reveal, and the 404 status for an unknown detail id. Pure
// rendering is covered by unit tests in src/modules/referents/__tests__/*
// (PublicReferentsPage, PublicReferentsSearchForm, PublicReferentDetail,
// PublicReferentList, schemas) and the query by the publicReferents router test.

// Fixed UUIDs so detail-page URLs (`/referents/[id]`) pass the
// `z.string().uuid()` check in `publicReferents.getById`.
const TEST_REFERENTS = [
	{
		id: "11111111-1111-4111-8111-111111111111",
		region: "11",
		county: "75",
		name: "E2E Référent Paris",
		type: "email" as const,
		value: "e2e-paris@dreets.test",
		principal: true,
		substituteName: "Suppléant Paris",
		substituteEmail: "e2e-paris-sub@dreets.test",
	},
	{
		id: "22222222-2222-4222-8222-222222222222",
		region: "11",
		county: "92",
		name: "E2E Référent Hauts-de-Seine",
		type: "url" as const,
		value: "https://dreets.test/contact-92",
		principal: false,
		substituteName: null,
		substituteEmail: null,
	},
	{
		id: "33333333-3333-4333-8333-333333333333",
		region: "53",
		county: "35",
		name: "E2E Référent Rennes",
		type: "email" as const,
		value: "e2e-rennes@dreets.test",
		principal: true,
		substituteName: null,
		substituteEmail: null,
	},
];

test.beforeAll(async () => {
	await seedReferents(TEST_REFERENTS);
});

test.afterAll(async () => {
	await deleteReferents(TEST_REFERENTS.map((r) => r.id));
});

test.describe("public referents search", () => {
	test("anonymous user can access /referents without authentication", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto("/referents");
			await expect(
				page.getByRole("heading", {
					name: /référents égalité professionnelle/i,
					level: 1,
				}),
			).toBeVisible();
			expect(page.url()).toContain("/referents");
		} finally {
			await anonCtx.close();
		}
	});

	test("region search filters the results and keeps contact details off the list", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto("/referents");
			await page.getByLabel("Région").selectOption("11");
			await page.getByRole("button", { name: /^rechercher$/i }).click();

			// Filtering: region 11 matches, region 53 does not.
			await expect(page.getByText("E2E Référent Paris")).toBeVisible();
			await expect(page.getByText("E2E Référent Hauts-de-Seine")).toBeVisible();
			await expect(page.getByText("E2E Référent Rennes")).not.toBeVisible();

			// Access control: contact details are hidden on the list.
			await expect(page.getByText("e2e-paris@dreets.test")).not.toBeVisible();
			await expect(
				page.getByText("e2e-paris-sub@dreets.test"),
			).not.toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});

	test("click-through to detail page reveals contact info", async ({
		browser,
	}) => {
		test.setTimeout(120_000);

		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			// Drive the search through the URL — the form only pushes these query
			// params and the results are fetched from them — so this exercises the
			// same code path without the flakiness of the client-side submit race.
			await page.goto("/referents?region=11&page=1");

			const list = page.getByTestId("public-referents-list");
			await expect(list).toBeVisible({ timeout: 30_000 });

			const row = list.locator("li", { hasText: "E2E Référent Paris" });
			await expect(row).toBeVisible({ timeout: 30_000 });
			await row.getByRole("link", { name: /voir le contact/i }).click();

			await expect(
				page.getByRole("heading", {
					level: 1,
					name: /E2E Référent Paris/,
				}),
			).toBeVisible({ timeout: 30_000 });
			await expect(page.getByText("e2e-paris@dreets.test")).toBeVisible();
			await expect(page.getByText("Suppléant Paris")).toBeVisible();
			await expect(page.getByText("e2e-paris-sub@dreets.test")).toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});

	test("detail page returns 404 for unknown id", async ({ browser }) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			const response = await page.goto(
				"/referents/00000000-0000-4000-8000-000000000000",
			);
			expect(response?.status()).toBe(404);
		} finally {
			await anonCtx.close();
		}
	});
});
