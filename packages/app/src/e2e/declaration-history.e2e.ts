import { expect, test } from "@playwright/test";

import { TEST_SIREN } from "./constants";
import {
	ensureCurrentYearDeclaration,
	getCurrentDbYear,
	resetDeclarationToDraft,
} from "./helpers/db";
import { insertHistoryEvents } from "./helpers/declaration-history";

// The history list rendering and the "Voir plus" pagination are covered by
// src/modules/declarationHistory/__tests__/HistoryListSection.test.tsx and
// DeclarationHistoryPage.test.tsx. Only the route smoke (the page renders the
// seeded entries under its heading) remains end-to-end.

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

		const items = page.locator("main ul > li");
		await expect(items).toHaveCount(3);
	});
});
