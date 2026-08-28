import { expect, type Page, test } from "@playwright/test";
import { getReferenceYearFor } from "~/modules/domain";
import { withCampaignYear } from "./helpers/campaign-year";
import {
	clearCategoryHourlyCounts,
	clearDeclarationDraft,
	deleteCurrentYearCategories,
	getCurrentDbYear,
	resetDeclarationToDraft,
	resetGipWorkforce,
	setGipWorkforce,
} from "./helpers/db";
import {
	categoryPayInput,
	categoryWorkforceInput,
	fillCategoryPayAmounts,
	fillStep4Quartiles,
	STEP1_WORKFORCE,
	STEP5_WORKFORCE_REMINDER,
	submitFromStep6Recap,
	submitStepsThroughPayGaps,
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

	test("displays step 1 with the N-1 reference period after login (#4075)", async ({
		page,
	}) => {
		await expect(
			page.getByRole("heading", {
				name: /Déclaration des indicateurs de rémunération/i,
			}),
		).toBeVisible();

		await expect(page.getByText("Étape 1 sur 6")).toBeVisible();

		// Expectation derived from getReferenceYearFor, never getReferencePeriod (the
		// function the bug lived in), so reverting the fix fails this test instead of
		// tautologically tracking it.
		const referenceYear = getReferenceYearFor(await getCurrentDbYear());
		await expect(
			page.getByText(
				`Période de référence pour le calcul des indicateurs : 01/01/${referenceYear} - 31/12/${referenceYear}.`,
			),
		).toBeVisible();
	});

	test("navigates through step 1 - Effectifs", async ({ page }) => {
		await page.waitForURL("**/declaration-remuneration/etape/1");

		// Verify stepper
		await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Effectifs/i }),
		).toBeVisible();

		// Fill workforce data directly in the table, one row per pay basis
		await page
			.getByRole("textbox", {
				name: "Rémunération annuelle — Nombre de femmes",
			})
			.fill("10");
		await page
			.getByRole("textbox", { name: "Rémunération annuelle — Nombre d'hommes" })
			.fill("15");
		await page
			.getByRole("textbox", { name: "Rémunération horaire — Nombre de femmes" })
			.fill("10");
		await page
			.getByRole("textbox", { name: "Rémunération horaire — Nombre d'hommes" })
			.fill("15");

		// Verify each row total is computed
		await expect(page.getByText("25", { exact: true }).first()).toBeVisible();

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

		// Target the recap by its accessible description rather than by DOM order:
		// coherence alerts can legitimately be rendered before it.
		const alert = page.getByRole("alert").filter({
			has: page.locator("#step4-error-summary-invalid"),
		});
		await expect(alert).toBeVisible();
		await expect(
			alert.getByRole("heading", { name: "Valeur invalide" }),
		).toBeVisible();
		await expect(
			alert.getByRole("link", {
				name: "Seuil 2e quartile (rémunération annuelle) — Les seuils doivent être strictement croissants",
			}),
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

	test("step 1 - empty submission names every missing field in the error alert (#4235)", async ({
		page,
	}) => {
		await goToStep(page, 1);

		// Clear any GIP-prefilled counts so the "empty → required error" path fires.
		await page
			.getByRole("textbox", {
				name: "Rémunération annuelle — Nombre de femmes",
			})
			.fill("");
		await page
			.getByRole("textbox", { name: "Rémunération annuelle — Nombre d'hommes" })
			.fill("");
		await page
			.getByRole("textbox", { name: "Rémunération horaire — Nombre de femmes" })
			.fill("");
		await page
			.getByRole("textbox", { name: "Rémunération horaire — Nombre d'hommes" })
			.fill("");

		await page.getByRole("button", { name: "Suivant" }).click();

		const alert = page.locator(".fr-alert--error").first();
		await expect(alert).toBeVisible();
		await expect(alert).toContainText("Champ vide");
		await expect(alert).toContainText(
			"Renseignez le nombre de femmes pour la rémunération annuelle.",
		);
		await expect(alert).toContainText(
			"Renseignez le nombre d'hommes pour la rémunération annuelle.",
		);
		await expect(alert).toContainText(
			"Renseignez le nombre de femmes pour la rémunération horaire.",
		);
		await expect(alert).toContainText(
			"Renseignez le nombre d'hommes pour la rémunération horaire.",
		);

		// #3971 guarded the inline message against overflowing its <td> (DSFR 1.14
		// sets white-space: nowrap on table cells). Since #4235 the message lives in
		// the alert under the table, so that overflow cannot occur by construction —
		// what has to hold now is that the cell carries the state and nothing else,
		// with the input pointing at the alert that names it.
		await expect(page.locator("td .fr-error-text")).toHaveCount(0);
		const womenInput = page.getByRole("textbox", {
			name: "Rémunération annuelle — Nombre de femmes",
		});
		await expect(womenInput).toHaveAttribute("aria-invalid", "true");
		const describedBy = await womenInput.getAttribute("aria-describedby");
		expect(describedBy).toBeTruthy();
		await expect(page.locator(`#${describedBy}`)).toContainText(
			"Renseignez le nombre de femmes pour la rémunération annuelle.",
		);
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

// #4260 — the quartile headcount check used to be an ignorable warning rendered above
// both tables, and the hourly table was checked against the GIP hourly reference (so it
// was unchecked without a GIP prefill). Both tables are now held to the step 1
// "Effectifs physiques" counts, divergence blocks the step, and the message sits under
// the offending table, below its "Source : DSN" note when prefill data exists, once
// per table. The unit tests cover the derivation and source-note ordering; what only
// the browser proves here is that "Suivant" no longer navigates and that the focus
// lands on the message of the table at fault.
test.describe("Step 4 — quartile totals must match the step 1 headcount (#4260)", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		await resetGipWorkforce();
		await resetDeclarationToDraft();
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
	});

	test("a diverging total blocks the step until it is corrected, on either table", async ({
		page,
	}) => {
		test.slow();

		const annualNote = page.getByRole("alert").filter({
			has: page.locator("#step4-coherence-annual-inconsistent"),
		});
		const hourlyNote = page.getByRole("alert").filter({
			has: page.locator("#step4-coherence-hourly-inconsistent"),
		});
		const annualWomenMismatchMessage = `Le nombre total de femmes renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total annuel : ${STEP1_WORKFORCE.women}).`;
		const next = page.getByRole("button", { name: "Suivant" });

		await submitStepsThroughPayGaps(page);

		await test.step("étape 4 — le total annuel de femmes diverge de l'étape 1", async () => {
			await fillStep4Quartiles(page);
			// Q4 women 2 → 4 makes the annual women total 12 against the 10 of step 1.
			// Each cell stays under the per-cell cap, so only the total is at fault.
			await page
				.getByRole("textbox", { name: "Nombre de femmes 4e quartile annuel" })
				.fill("4");

			await expect(annualNote).toContainText(annualWomenMismatchMessage);
			await expect(hourlyNote).toHaveCount(0);

			// This journey has a GIP workforce row but no DSN prefill payload, so it has
			// no source note. Its browser-level invariant is that the message belongs to
			// the table it indicts: after the annual table and before the hourly one —
			// not above both, as the old warning was. The source-note variant is covered
			// by Step4QuartileCoherence.test.tsx.
			const placement = await annualNote.evaluate((note) => {
				const captioned = (needle: string) =>
					Array.from(document.querySelectorAll("table")).find((table) =>
						table.querySelector("caption")?.textContent?.includes(needle),
					);
				const annual = captioned("Rémunération annuelle");
				const hourly = captioned("Rémunération horaire");
				if (!annual || !hourly) return null;
				return {
					afterAnnualTable: Boolean(
						annual.compareDocumentPosition(note) &
							Node.DOCUMENT_POSITION_FOLLOWING,
					),
					beforeHourlyTable: Boolean(
						hourly.compareDocumentPosition(note) &
							Node.DOCUMENT_POSITION_PRECEDING,
					),
				};
			});
			expect(placement).toEqual({
				afterAnnualTable: true,
				beforeHourlyTable: true,
			});
		});

		await test.step("« Suivant » ne quitte pas l'étape et le focus va sur le message du tableau", async () => {
			await next.click();

			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/4$/);
			await expect(annualNote).toBeFocused();
			// One message, under the table at fault — no second copy in a summary.
			await expect(
				page.getByText(annualWomenMismatchMessage, { exact: true }),
			).toHaveCount(1);
		});

		await test.step("le contrôle horaire vit sur l'effectif horaire de l'étape 1", async () => {
			await page
				.getByRole("textbox", { name: "Nombre de femmes 4e quartile annuel" })
				.fill("2");
			await expect(annualNote).toHaveCount(0);

			// The hourly table used to be checked against the GIP hourly reference; it
			// answers to the hourly headcount of step 1 now (#4247), which this journey
			// declares equal to the annual one, so breaking its men total blocks too.
			await page
				.getByRole("textbox", { name: "Nombre d'hommes 4e quartile horaire" })
				.fill("5");

			await next.click();

			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/4$/);
			await expect(hourlyNote).toContainText(
				`(nombre total horaire : ${STEP1_WORKFORCE.men})`,
			);
			await expect(hourlyNote).toBeFocused();
		});

		await test.step("les deux totaux corrigés, l'étape se valide", async () => {
			await page
				.getByRole("textbox", { name: "Nombre d'hommes 4e quartile horaire" })
				.fill("3");
			await expect(hourlyNote).toHaveCount(0);

			await next.click();
			await page.waitForURL("**/declaration-remuneration/etape/5");
		});
	});
});

// #4254 — a category used to declare one "Effectif physique" line. It now declares a
// headcount on each of the two pay bases of step 1, and each basis answers for itself:
// its own step 1 total, and its own pay amounts. The table rendering, the message
// wording and the per-basis completeness rule are unit-tested; what only the browser
// proves is the chain end to end — that both counts reach Postgres and come back on a
// reload, and that a row written before the columns existed still reopens with its
// annual figures intact, since the migration backfills nothing.
test.describe("Step 5 — one physical headcount per pay basis (#4254)", () => {
	test.describe.configure({ mode: "serial" });

	const rowTotal = (page: Page, rowLabel: string) =>
		page
			.getByRole("row")
			.filter({
				has: page.getByRole("rowheader", { exact: true, name: rowLabel }),
			})
			.getByRole("cell")
			.last();

	test.beforeAll(async () => {
		await resetGipWorkforce();
		await resetDeclarationToDraft();
		// Categories outlive resetDeclarationToDraft, and a pre-populated step 5
		// replaces the source select this journey drives with read-only text.
		await deleteCurrentYearCategories();
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
		await deleteCurrentYearCategories();
	});

	test("each basis carries its own count, its own checks and its own persistence", async ({
		page,
	}) => {
		test.slow();

		const next = page.getByRole("button", { name: "Suivant" });
		const inconsistent = page.locator("#step5-categories-error-inconsistent");
		const emptyFields = page.locator("#step5-categories-error-empty");
		const count = (basis: "annual" | "hourly", sex: "women" | "men") =>
			categoryWorkforceInput(page, { basis, sex });

		await submitStepsThroughQuartiles(page);
		await page.waitForURL("**/declaration-remuneration/etape/5");

		await test.step("le tableau des effectifs porte les deux bases, sous le rappel", async () => {
			await page
				.getByRole("combobox", {
					name: /source utilisée pour déterminer les catégories/i,
				})
				.selectOption("accord-entreprise");
			await page
				.getByRole("textbox", { name: "Libellé" })
				.fill("Catégorie test");

			await expect(page.getByText(STEP5_WORKFORCE_REMINDER)).toBeVisible();
			await expect(
				page.getByRole("heading", {
					name: "Nombre de salariés en effectif physique",
				}),
			).toBeVisible();

			await count("annual", "women").fill(String(STEP1_WORKFORCE.women));
			await count("annual", "men").fill(String(STEP1_WORKFORCE.men));
			await count("hourly", "women").fill(String(STEP1_WORKFORCE.women));

			// The Total is computed per row: the hourly one has nothing to add up
			// until both of its cells are entered.
			await expect(rowTotal(page, "Rémunération annuelle")).toHaveText(
				String(STEP1_WORKFORCE.women + STEP1_WORKFORCE.men),
			);
			await expect(rowTotal(page, "Rémunération horaire")).toHaveText("-");

			await count("hourly", "men").fill(String(STEP1_WORKFORCE.men));
			await expect(rowTotal(page, "Rémunération horaire")).toHaveText(
				String(STEP1_WORKFORCE.women + STEP1_WORKFORCE.men),
			);
		});

		await test.step("la cohérence avec l'étape 1 nomme la ligne fautive", async () => {
			await fillCategoryPayAmounts(page, { men: "1000", women: "1000" });

			await count("hourly", "women").fill(String(STEP1_WORKFORCE.women - 1));
			await next.click();

			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/5$/);
			await expect(inconsistent).toHaveText(
				`Le total des effectifs femmes de la ligne « Rémunération horaire » (${STEP1_WORKFORCE.women - 1}) ne correspond pas à l'effectif déclaré à l'étape 1 (${STEP1_WORKFORCE.women}).`,
			);

			// Same divergence on the other row: only the row at fault is named, so
			// the two bases cannot be satisfied by one another.
			await count("hourly", "women").fill(String(STEP1_WORKFORCE.women));
			await count("annual", "men").fill(String(STEP1_WORKFORCE.men - 1));
			await next.click();

			await expect(inconsistent).toHaveText(
				`Le total des effectifs hommes de la ligne « Rémunération annuelle » (${STEP1_WORKFORCE.men - 1}) ne correspond pas à l'effectif déclaré à l'étape 1 (${STEP1_WORKFORCE.men}).`,
			);
		});

		await test.step("un effectif n'exige que les rémunérations de sa base", async () => {
			await count("annual", "women").fill("0");
			await count("annual", "men").fill("0");
			for (const measure of [
				"Salaire de base annuel",
				"Composantes variables annuelles",
			] as const) {
				await categoryPayInput(page, { measure, sex: "femmes" }).fill("");
				await categoryPayInput(page, { measure, sex: "hommes" }).fill("");
			}
			await categoryPayInput(page, {
				measure: "Salaire de base horaire",
				sex: "femmes",
			}).fill("");

			await next.click();

			// Exactly one message: the hourly headcount claims its own missing field
			// and the four emptied annual amounts are claimed by nobody.
			await expect(emptyFields).toHaveText(
				"Renseignez le salaire de base horaire des femmes pour la catégorie d'emplois n°1.",
			);
		});

		await test.step("les huit compteurs et rémunérations franchissent l'étape et reviennent", async () => {
			await count("annual", "women").fill(String(STEP1_WORKFORCE.women));
			await count("annual", "men").fill(String(STEP1_WORKFORCE.men));
			await fillCategoryPayAmounts(page, { men: "1000", women: "1000" });

			await next.click();
			await page.waitForURL("**/declaration-remuneration/etape/6");

			await page.goto("/declaration-remuneration/etape/5");
			for (const basis of ["annual", "hourly"] as const) {
				await expect(count(basis, "women")).toHaveValue(
					String(STEP1_WORKFORCE.women),
				);
				await expect(count(basis, "men")).toHaveValue(
					String(STEP1_WORKFORCE.men),
				);
			}
		});

		await test.step("une catégorie antérieure aux colonnes rouvre sans rien perdre", async () => {
			await clearDeclarationDraft();
			await clearCategoryHourlyCounts();
			await page.reload();

			await expect(count("annual", "women")).toHaveValue(
				String(STEP1_WORKFORCE.women),
			);
			await expect(count("annual", "men")).toHaveValue(
				String(STEP1_WORKFORCE.men),
			);
			await expect(count("hourly", "women")).toHaveValue("");
			await expect(count("hourly", "men")).toHaveValue("");
			await expect(rowTotal(page, "Rémunération horaire")).toHaveText("-");
		});
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
				`Effectif annuel moyen en ${currentYear - 1} :`,
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

	// Issue 3914: the bracket used to key on "absent from the GIP file", so a
	// company present in the file under the threshold rendered its exact
	// headcount. The two cases are one tier and must read the same.
	test.describe("company present in the GIP file below the voluntary threshold", () => {
		test.beforeAll(async () => {
			await setGipWorkforce(37);
			await resetDeclarationToDraft();
		});

		test("mon espace brackets the headcount instead of printing it", async ({
			page,
		}) => {
			await page.goto("/mon-espace");

			const companyInfo = page
				.locator("dl")
				.filter({ hasText: "Effectif annuel moyen" })
				.first();
			await expect(companyInfo).toContainText(
				`Effectif annuel moyen en ${currentYear - 1} :`,
			);
			await expect(companyInfo).toContainText("< 50");
			await expect(companyInfo).not.toContainText("37");
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
// row per declaration type the company is in scope for — here rémunération only,
// since #3702 gates the représentation line behind a GIP pre-filter this 250-employee
// coordinate does not clear — so a bare row count would encode that arity instead of
// the isolation property. And a row cannot be matched on its text: a campaign-year row
// legitimately mentions N-1, the reference year its figures describe. Only the Année
// cell discriminates.
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
			await expect(rowsForYear("2033")).toHaveCount(1);
			await expect(rowsForYear("2033")).toContainText("Rémunération");
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

		// The hint is wired to the field for assistive tech. #4254 gave it the Figma
		// text; the 255 limit it used to spell out is now carried by the maxLength
		// attribute asserted below and by the Zod message, not by the hint.
		await expect(page.locator("#cat-0-name-hint")).toHaveText(
			"En référence à l'accord ou à la décision unilatérale",
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
