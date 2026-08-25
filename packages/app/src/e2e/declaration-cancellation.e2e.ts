import { expect, test } from "@playwright/test";
import { TEST_SIREN } from "./constants";
import {
	cleanCurrentYearDeclarations,
	ensureCurrentYearDeclaration,
	getCurrentDbYear,
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";
import { fetchSuitDeclarations } from "./helpers/suit-export";

test.describe("Declaration cancellation — full cycle", () => {
	test.describe.configure({ mode: "serial" });

	let currentYear: number;

	test.beforeAll(async () => {
		currentYear = await getCurrentDbYear();
		await cleanCurrentYearDeclarations();
		// Force a "clean finish" submit path : workforce < 100 + no CSE → the
		// no-gap submit transitions directly to `demarche_completed` and shows
		// the "Effectué" badge. Without this, leftover state from previous
		// suites (workforce=200, hasCse=true) drives the FSM through
		// `awaiting_cse_opinion`, where the badge is correctly "En cours".
		await setCompanyHasCse(false);
		await setCompanyWorkforce(80);
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

		// S8 — admin opens a cancelled declaration from the list and sees the badge.
		// We click directly the first row whose status badge is "Annulée" so the
		// navigation target is unambiguous (no dependency on a URL captured
		// earlier in the test cycle).
		const cancelledRow = page
			.locator("table tbody tr")
			.filter({ hasText: "Annulée" })
			.first();
		await cancelledRow.getByRole("link").first().click();
		await page.waitForLoadState("networkidle");
		await expect(page.getByText(/Annulée le/)).toBeVisible({
			timeout: 10_000,
		});
	});

	// Epic #4122, point d'attention : « si une déclaration est annulée, il faut
	// qu'elle remonte dans l'api SUIT ». The cycle above leaves exactly the state
	// that proves it — two cancelled rows and one active — so the machine contract
	// is asserted here rather than replaying three funnels for it.
	test("the SUIT export surfaces the cancelled declarations alongside the active one", async ({
		browser,
	}) => {
		const declarations = (await fetchSuitDeclarations(browser)).filter(
			(entry) => entry.Parcours.Annee === currentYear,
		);
		expect(declarations).toHaveLength(3);

		const cancelled = declarations.filter((entry) => entry.Parcours.Annulee);
		const active = declarations.filter((entry) => !entry.Parcours.Annulee);
		expect(cancelled).toHaveLength(2);
		expect(active).toHaveLength(1);

		for (const entry of cancelled) {
			expect(entry.Date_annulation).not.toBeNull();
			// A cancelled declaration has no next step to offer: the démarche restarts
			// from a new row, it does not resume from this one.
			expect(entry.Parcours.Prochaines_etapes_possibles).toEqual([]);
		}

		expect(active[0]?.Date_annulation).toBeNull();
		expect(
			active[0]?.Parcours.Prochaines_etapes_possibles.length,
		).toBeGreaterThan(0);
	});
});
