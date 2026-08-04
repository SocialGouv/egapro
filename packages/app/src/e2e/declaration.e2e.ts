import { expect, type Page, test } from "@playwright/test";
import { EXPECTED_DECLARATION_TYPES } from "~/modules/domain";
import { withCampaignYear } from "./helpers/campaign-year";
import {
	getCurrentDbYear,
	resetDeclarationToDraft,
	resetGipWorkforce,
	setGipWorkforce,
} from "./helpers/db";
import {
	submitFromStep6Recap,
	submitStepsThroughQuartiles,
} from "./helpers/declaration-flows";

// Render-structure assertions are covered by the step component tests in declaration-remuneration/**/__tests__.

/** Navigate to a declaration step, ensuring the declaration is initialized first. */
async function goToStep(page: Page, step: number) {
	await page.goto("/declaration-remuneration");
	await page.waitForURL("**/declaration-remuneration/etape/**");
	await page.goto(`/declaration-remuneration/etape/${step}`);
	await page.waitForURL(`**/declaration-remuneration/etape/${step}`);
	await expect(page.getByText(`Étape ${step} sur 6`)).toBeVisible();
}

test.describe("Declaration workflow", () => {
	test.describe.configure({ mode: "serial" });

	// Reset DB state before this suite runs so it starts from a clean slate.
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
	});

	test.beforeEach(async ({ page }) => {
		// Auth is handled by storageState from auth.setup.ts
		await page.goto("/declaration-remuneration");
		await page.waitForURL("**/declaration-remuneration/etape/**");
	});

	test("displays step 1 after login", async ({ page }) => {
		await expect(
			page.getByRole("heading", {
				name: /Déclaration des indicateurs de rémunération/i,
			}),
		).toBeVisible();

		await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
	});

	test("navigates through step 1 - Effectifs", async ({ page }) => {
		await page.waitForURL("**/declaration-remuneration/etape/1");

		// Verify stepper
		await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Effectifs/i }),
		).toBeVisible();

		// Fill workforce data directly in the table
		await page.getByRole("textbox", { name: "Nombre de femmes" }).fill("10");
		await page.getByRole("textbox", { name: "Nombre d'hommes" }).fill("15");

		// Verify total is computed
		await expect(page.getByText("25", { exact: true })).toBeVisible();

		// Submit and navigate to step 2
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("**/declaration-remuneration/etape/2");
	});

	test("step 2 - Écart de rémunération inline editing", async ({ page }) => {
		await goToStep(page, 2);

		await expect(page.getByText("Étape 2 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Écart de rémunération/i }),
		).toBeVisible();

		// Fill pay gap data directly in the table
		await page
			.getByRole("textbox", { name: "Annuelle brute moyenne — Femmes" })
			.fill("30000");
		await page
			.getByRole("textbox", { name: "Annuelle brute moyenne — Hommes" })
			.fill("32000");

		// Verify gap is computed and displayed in the table cell
		await expect(
			page.getByRole("table").getByText("6,25 %", { exact: true }),
		).toBeVisible();
	});

	test("step 3 - Rémunération variable inline editing", async ({ page }) => {
		await goToStep(page, 3);

		await expect(page.getByText("Étape 3 sur 6")).toBeVisible();

		// Fill variable pay data directly in the table
		await page
			.getByRole("textbox", { name: "Annuelle brute moyenne — Femmes" })
			.fill("5000");
		await page
			.getByRole("textbox", { name: "Annuelle brute moyenne — Hommes" })
			.fill("5500");

		// Verify gap is computed
		await expect(page.getByText("9,09 %")).toBeVisible();

		// Verify beneficiary inputs are present
		await expect(
			page.getByRole("textbox", { name: "Bénéficiaires femmes" }),
		).toBeVisible();
		await expect(
			page.getByRole("textbox", { name: "Bénéficiaires hommes" }),
		).toBeVisible();
	});

	test("step 4 - cascade: filling Q1 threshold updates Q2 lower bound live", async ({
		page,
	}) => {
		await goToStep(page, 4);

		// Scope to the annual table — the hourly table is pre-populated with
		// GIP-MDS data for the test SIREN.
		const annualTable = page.getByRole("table", {
			name: "Rémunération annuelle brute moyenne",
		});

		// S2 — fill annual Q1 max (the only threshold input on the Q1 row)
		const seuil1Annual = annualTable.getByRole("textbox", {
			name: "Seuil maximum 1er quartile annuel",
		});
		await seuil1Annual.fill("20000");

		// Q2 row's first cell is the lower-bound, computed from Q1 threshold
		// + 0,01 → "20 000,01 €" (live cascade update).
		const q2Row = annualTable.locator("tbody > tr").filter({
			has: page.getByRole("rowheader", { name: "2e quartile" }),
		});
		await expect(q2Row.locator("td").first()).toHaveText("20 000,01 €");
	});

	test("step 4 - non-crescent thresholds trigger recap alert with anchors (S3)", async ({
		page,
	}) => {
		await goToStep(page, 4);

		// Fill non-crescent annual thresholds : 30000, 20000, 40000
		await page
			.getByRole("textbox", { name: "Seuil maximum 1er quartile annuel" })
			.fill("30000");
		await page
			.getByRole("textbox", { name: "Seuil maximum 2e quartile annuel" })
			.fill("20000");
		await page
			.getByRole("textbox", { name: "Seuil maximum 3e quartile annuel" })
			.fill("40000");

		// Fill hourly thresholds (valid) and all 8 counts to isolate the croissance error
		await page
			.getByRole("textbox", { name: "Seuil maximum 1er quartile horaire" })
			.fill("10");
		await page
			.getByRole("textbox", { name: "Seuil maximum 2e quartile horaire" })
			.fill("20");
		await page
			.getByRole("textbox", { name: "Seuil maximum 3e quartile horaire" })
			.fill("30");
		for (const ordinal of ["1er", "2e", "3e", "4e"] as const) {
			await page
				.getByRole("textbox", {
					name: `Nombre de femmes ${ordinal} quartile annuel`,
				})
				.fill("1");
			await page
				.getByRole("textbox", {
					name: `Nombre d'hommes ${ordinal} quartile annuel`,
				})
				.fill("1");
			await page
				.getByRole("textbox", {
					name: `Nombre de femmes ${ordinal} quartile horaire`,
				})
				.fill("1");
			await page
				.getByRole("textbox", {
					name: `Nombre d'hommes ${ordinal} quartile horaire`,
				})
				.fill("1");
		}

		await page.getByRole("button", { name: "Suivant" }).click();

		// Recap alert with anchor links
		const alert = page.getByRole("alert").first();
		await expect(alert).toBeVisible();
		await expect(alert).toContainText(/Le formulaire contient des erreurs/);
		await expect(
			alert
				.getByRole("link")
				.filter({
					has: page.locator("text=/quartile/"),
				})
				.first(),
		).toBeVisible();
	});

	test("step 4 - empty submission shows 'Le seuil est obligatoire' on threshold cells (S4)", async ({
		page,
	}) => {
		await goToStep(page, 4);

		// The test SIREN has GIP-MDS prefilled thresholds — clear them so the
		// "all empty → required errors" path is exercised.
		for (const ordinal of ["1er", "2e", "3e"] as const) {
			await page
				.getByRole("textbox", {
					name: `Seuil maximum ${ordinal} quartile annuel`,
				})
				.fill("");
			await page
				.getByRole("textbox", {
					name: `Seuil maximum ${ordinal} quartile horaire`,
				})
				.fill("");
		}

		await page.getByRole("button", { name: "Suivant" }).click();

		// At least one error message per missing threshold
		await expect(
			page.getByText("Le seuil est obligatoire").first(),
		).toBeVisible();
	});

	test("previous button navigates back", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/2");

		await page.getByRole("link", { name: "Précédent" }).click();
		await page.waitForURL("**/declaration-remuneration/etape/1");
	});

	// Must be last — mutates declaration status to 'submitted'
	test("step 6 submit leaves declaration page", async ({ page }) => {
		await goToStep(page, 6);

		await submitFromStep6Recap(page);

		// After submission, compliance path kicks in. Destination depends on hasCse
		// and gap state — exact routing is tested in compliance.e2e.ts.
		// Here we just verify we left the declaration wizard.
		await page.waitForURL(
			(url) => !url.pathname.includes("/declaration-remuneration/etape/"),
			{ timeout: 15_000 },
		);
	});
});

// The suite baseline above is a >= 250 GIP company: 6 steps, CSE field, indicator G required.
// Below, the same journeys are replayed for the two smaller GIP profiles of #3929/#3934.
test.describe("Workforce comes from the GIP file, not the company registry", () => {
	test.describe.configure({ mode: "serial" });

	let currentYear: number;

	test.beforeAll(async () => {
		currentYear = await getCurrentDbYear();
	});

	test.afterAll(async () => {
		await resetGipWorkforce();
		await resetDeclarationToDraft();
	});

	test.describe("company absent from the GIP file", () => {
		test.beforeAll(async () => {
			await setGipWorkforce(null);
			await resetDeclarationToDraft();
		});

		test('mon espace shows "< 50" and drops the CSE field and the edit button', async ({
			page,
		}) => {
			await page.goto("/mon-espace");

			const companyInfo = page
				.locator("dl")
				.filter({ hasText: "Effectif annuel moyen" })
				.first();
			await expect(companyInfo).toContainText(
				`Effectif annuel moyen en ${currentYear} :`,
			);
			await expect(companyInfo).toContainText("< 50");
			await expect(companyInfo).not.toContainText("Existence d'un CSE");
			await expect(
				page.getByRole("button", { exact: true, name: "Modifier" }),
			).toHaveCount(0);
		});

		// #4043: absent from the GIP file → obligation workforce 0 → voluntary tier,
		// which declares all 7 indicators every year. Step 5 is therefore presented
		// (it used to be skipped), and the funnel keeps its 6 steps.
		test("the funnel keeps the indicator G step", async ({ page }) => {
			await page.goto("/declaration-remuneration/etape/5");

			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/5$/);
			await expect(page.getByText("Étape 5 sur 6")).toBeVisible();
			await expect(
				page.getByRole("heading", {
					name: /Écart de rémunération par catégories de salariés/,
				}),
			).toBeVisible();
		});
	});

	// GIP workforce of 70 (bracket 50-99): whether indicator G / step 5 applies
	// flips on the campaign year via isIndicatorGRequired(70, year) — never below
	// 2030, and only in a triennial year from 2030. Pinning both years keeps the
	// two branches exercised instead of letting the assertion silently flip red
	// when the calendar reaches 2030 (#4067). withCampaignYear seeds the GIP row
	// for the pinned year and tears the coordinate down afterwards.
	test.describe("GIP workforce of 70 — indicator G gated by the pinned year", () => {
		test.describe.configure({ mode: "serial" });

		test("6-indicator year (2029): banners show the workforce and the funnel drops step 5", async ({
			page,
		}) => {
			await withCampaignYear({ page, year: 2029, workforce: 70 }, async () => {
				await page.goto("/mon-espace");

				const companyInfo = page
					.locator("dl")
					.filter({ hasText: "Effectif annuel moyen" })
					.first();
				await expect(companyInfo).toContainText("70");
				await expect(companyInfo).not.toContainText("Existence d'un CSE");
				// Nothing is editable below 100, so the edit entry point is dropped too.
				await expect(
					page.getByRole("button", { exact: true, name: "Modifier" }),
				).toHaveCount(0);

				await page.goto("/declaration-remuneration/etape/1");
				await expect(page.getByText("Étape 1 sur 5")).toBeVisible();
				// 2029 campaign → workforce reference year N-1 = 2028 (getWorkforceYear).
				await expect(
					page.getByText("Effectif annuel moyen en 2028 :"),
				).toBeVisible();
				await expect(page.getByText("Existence d'un CSE :")).toHaveCount(0);

				await submitStepsThroughQuartiles(page);
				await page.waitForURL("**/declaration-remuneration/etape/6");
				await expect(page.getByText("Étape 5 sur 5")).toBeVisible();
			});
		});

		test("7-indicator year (2030): the funnel regains the indicator-G step", async ({
			page,
		}) => {
			await withCampaignYear({ page, year: 2030, workforce: 70 }, async () => {
				await page.goto("/declaration-remuneration/etape/1");
				await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
				await page.goto("/declaration-remuneration/etape/5");
				await expect(page.getByText("Étape 5 sur 6")).toBeVisible();
			});
		});
	});
});

// #4067 — withCampaignYear isolates one coordinate from the next. After a
// declaration is built under year N, moving to year N+1 must leave no trace of N
// (declaration, files, CSE opinion, has_cse). This proves it at the /mon-espace
// listing, which aggregates every year's declaration for the SIREN — the very
// surface interference #1 of the spec warns would otherwise show 7 rows after a
// grid run. The rigorous, row-count proof of resetCampaignYear lives in
// db-campaign.resetCampaignYear.integration.test.ts.
//
// Two things make the assertion narrower than it looks. The listing carries one
// row per expected declaration type (rémunération + représentation), so a bare
// row count would encode that arity instead of the isolation property. And a row
// cannot be matched on its text: a campaign-year row legitimately mentions N-1,
// the reference year its figures describe. Only the Année cell discriminates.
test.describe("withCampaignYear leaves no residue between two year coordinates (#4067)", () => {
	test("a run pinned on 2033 leaves no trace of the 2032 coordinate", async ({
		page,
	}) => {
		test.slow();
		// Coordinate A: create a declaration under 2032, then let the fixture tear it down.
		await withCampaignYear({ page, year: 2032, workforce: 250 }, async () => {
			await page.goto("/declaration-remuneration");
			await page.waitForURL("**/declaration-remuneration/etape/**");
		});

		// Coordinate B: 2033 is listed, 2032 is gone — A left no residue.
		await withCampaignYear({ page, year: 2033, workforce: 250 }, async () => {
			await page.goto("/declaration-remuneration");
			await page.waitForURL("**/declaration-remuneration/etape/**");

			await page.goto("/mon-espace");
			const currentDeclarations = page.locator(
				'table[aria-labelledby="demarches-en-cours-title"] tbody tr',
			);
			const rowsForYear = (year: string) =>
				currentDeclarations.filter({
					has: page.getByRole("cell", { name: year, exact: true }),
				});

			await expect(rowsForYear("2032")).toHaveCount(0);
			await expect(rowsForYear("2033")).toHaveCount(
				EXPECTED_DECLARATION_TYPES.length,
			);
		});
	});
});

// Regression guard for #3943: the indicator G category label maps to a
// varchar(255) column. Before the fix the field accepted unbounded input, so an
// over-long label made Postgres reject the insert and surfaced the raw Drizzle
// SQL query to the user (broken UX + technical disclosure). The fix bounds the
// input client-side and documents the limit with a DSFR hint.
test.describe("Indicator G — category label is bounded to 255 characters (#3943)", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		// >= 250 workforce → the funnel keeps step 5 / indicator G.
		await resetGipWorkforce();
		await resetDeclarationToDraft();
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
	});

	test("caps the label input at 255 chars and exposes the DSFR hint", async ({
		page,
	}) => {
		await submitStepsThroughQuartiles(page);
		await page.waitForURL("**/declaration-remuneration/etape/5");

		// Pick a source when categories aren't pre-populated, so the editable
		// category form (with its label input) is rendered.
		const sourceSelect = page.getByRole("combobox", {
			name: /source utilisée pour déterminer les catégories/i,
		});
		if (await sourceSelect.isVisible({ timeout: 1_000 }).catch(() => false)) {
			await sourceSelect.selectOption("accord-entreprise");
		}

		const nameInput = page.locator("#cat-0-name");
		await expect(nameInput).toBeVisible();

		// Hint added by the fix, wired to the field for assistive tech.
		await expect(page.locator("#cat-0-name-hint")).toHaveText(
			"255 caractères maximum",
		);
		await expect(nameInput).toHaveAttribute(
			"aria-describedby",
			/cat-0-name-hint/,
		);

		// The guard that prevents the varchar(255) overflow (and thus the raw SQL
		// error at submit) is the maxLength cap on the native input.
		await expect(nameInput).toHaveAttribute("maxlength", "255");

		await nameInput.fill("a".repeat(300));
		await expect(nameInput).toHaveJSProperty("value.length", 255);
	});
});
