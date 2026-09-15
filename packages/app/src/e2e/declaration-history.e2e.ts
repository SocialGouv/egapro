import { expect, test } from "@playwright/test";

import { TEST_SIREN } from "./constants";
import {
	ensureCurrentYearDeclaration,
	getCurrentDbYear,
	resetDeclarationToDraft,
} from "./helpers/db";
import { insertHistoryEvents } from "./helpers/declaration-history";

// List rendering + "Voir plus" pagination are covered by declarationHistory/__tests__/HistoryListSection.test.tsx.

test.describe("Declaration history page", () => {
	test.setTimeout(60_000);

	let year: number;

	test.beforeAll(async () => {
		year = await getCurrentDbYear();
		await ensureCurrentYearDeclaration();
		await insertHistoryEvents(3, year);
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
	});

	test("displays history entries (S2)", async ({ page }) => {
		await page.goto(`/mon-espace/historique/${TEST_SIREN}/${year}`);

		await expect(
			page.getByRole("heading", {
				level: 1,
				name: "Historique des modifications",
			}),
		).toBeVisible();
		await expect(
			page.getByText(`Démarche des indicateurs de rémunération ${year}`),
		).toBeVisible();

		// #4256: same removal as the company banner, on the other `/mon-espace/**` surface.
		await expect(page.locator(".fr-breadcrumb")).toHaveCount(0);

		const items = page.locator("main ul > li");
		await expect(items).toHaveCount(3);
	});

	test.describe("entry date and time (S4)", () => {
		test.beforeAll(async () => {
			// Noon UTC keeps the calendar day at the 1st in every timezone the
			// server or the browser may run in, so the ordinal is what is asserted.
			await insertHistoryEvents(1, year, {
				firstEventAt: new Date(Date.UTC(year, 5, 1, 12, 0)),
			});
		});

		test.afterAll(async () => {
			await insertHistoryEvents(3, year);
		});

		test("writes the first of the month with its French ordinal, next to a 24-hour time", async ({
			page,
		}) => {
			await page.goto(`/mon-espace/historique/${TEST_SIREN}/${year}`);

			const entry = page.locator("main ul > li").first();

			await expect(entry.getByRole("time")).toHaveText(`1ᵉʳ juin ${year}`);
			await expect(entry.getByText(/^\d{2}:\d{2}$/)).toBeVisible();
		});
	});
});
