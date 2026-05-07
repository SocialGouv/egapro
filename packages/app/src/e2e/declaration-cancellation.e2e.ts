import { expect, test } from "@playwright/test";
import { TEST_SIREN } from "./constants";
import {
	cleanCurrentYearDeclarations,
	ensureCurrentYearDeclaration,
	getCurrentDbYear,
	resetDeclarationToDraft,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";

test.describe("Declaration cancellation — full cycle", () => {
	test.describe.configure({ mode: "serial" });

	let currentYear: number;

	test.beforeAll(async () => {
		currentYear = await getCurrentDbYear();
		await cleanCurrentYearDeclarations();
	});

	test.afterAll(async () => {
		await cleanCurrentYearDeclarations();
		await ensureCurrentYearDeclaration();
		await resetDeclarationToDraft();
	});

	test("submit → cancel → resubmit → cancel → resubmit, then verify admin list and cancelled badge", async ({
		page,
	}) => {
		const adminListUrl = `/admin/declarations?query=${TEST_SIREN}&year=${currentYear}&sortBy=createdAt&sortOrder=desc`;

		async function findFirstDeclarationLink() {
			await page.goto(adminListUrl);
			await page.waitForLoadState("networkidle");
			return page.locator("table tbody tr").first().getByRole("link").first();
		}

		async function cancelCurrentDeclaration() {
			await page
				.getByRole("button", { name: "Annuler la déclaration" })
				.click();
			await page
				.getByRole("button", { name: "Confirmer l'annulation" })
				.click();
			await expect(page.getByText(/Annulée le/)).toBeVisible({
				timeout: 10_000,
			});
		}

		// S1 — declarant submits first declaration
		await completeDeclaration(page, { hasGap: false });

		// Verify mon-espace shows "Effectué" (status=submitted → done)
		await page.goto("/mon-espace");
		await expect(page.getByText("Effectué").first()).toBeVisible();

		// Admin navigates to first submission and cancels it
		const firstLink = await findFirstDeclarationLink();
		await firstLink.click();
		await page.waitForLoadState("networkidle");
		const cancelledUrl1 = page.url();
		await cancelCurrentDeclaration();

		// S5 — declarant espace shows "À compléter" after cancellation
		await page.goto("/mon-espace");
		await expect(page.getByText("À compléter").first()).toBeVisible();

		// S2 — declarant re-submits (second declaration)
		await completeDeclaration(page, { hasGap: false });
		await page.goto("/mon-espace");
		await expect(page.getByText("Effectué").first()).toBeVisible();

		// S3 — admin cancels second declaration (cycle multi-annulations)
		const secondLink = await findFirstDeclarationLink();
		await secondLink.click();
		await page.waitForLoadState("networkidle");
		await cancelCurrentDeclaration();

		await page.goto("/mon-espace");
		await expect(page.getByText("À compléter").first()).toBeVisible();

		// S3 — declarant re-submits a third time
		await completeDeclaration(page, { hasGap: false });
		await page.goto("/mon-espace");
		await expect(page.getByText("Effectué").first()).toBeVisible();

		// S8 — admin lists declarations for this SIREN/year: 3 rows (2 cancelled + 1 active)
		await page.goto(adminListUrl);
		await page.waitForLoadState("networkidle");
		const rows = page.locator("table tbody tr");
		await expect(rows.first()).toBeVisible();
		expect(await rows.count()).toBe(3);

		// S8 — admin opens a cancelled declaration and sees "Annulée" badge
		await page.goto(cancelledUrl1);
		await expect(page.getByText(/Annulée le/)).toBeVisible();
	});
});
