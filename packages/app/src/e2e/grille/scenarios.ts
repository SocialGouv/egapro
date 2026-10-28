import { expect, type Page, test } from "@playwright/test";
import {
	COMPLIANCE_CONFIRMATION,
	COMPLIANCE_PATH,
	CSE_OPINION,
	cseOpinionStepHref,
	remunerationStepHref,
} from "~/modules/routes";
import { withCampaignYear } from "../helpers/campaign-year";
import {
	CORRECTIVE_PATH_TITLE,
	completeSecondDeclaration,
	fillCseStep1,
	GAP_JUSTIFICATION_TITLES,
	selectCompliancePath,
	submitCseStep2,
	uploadJointEvalPdf,
} from "../helpers/compliance-flows";
import { setCompanyHasCse } from "../helpers/db";
import {
	completeDeclaration,
	reachRecapWithoutGap,
	reachStep6ComplianceRecap,
	reachStep6Recap,
	submitFromStep6Recap,
} from "../helpers/declaration-flows";
import { recapStepperLabel } from "../helpers/indicator-g";
import { openPanneauDemarche, transmittedRow } from "../helpers/process-panel";
import { expectCompletionReceiptWhenMailChainUp } from "../helpers/receipts";
import { urlGlob, urlPattern } from "../helpers/routes";
import type { Coordinate } from "./coordinates";

export type ScenarioContext = {
	page: Page;
	coordinate: Coordinate;
	/** Opinion axis for CSE accuracy and gap steps. Defaults to "favorable" — the grid always runs in favorable mode. */
	opinion?: "favorable" | "unfavorable";
};

const CONFIRMATION_PATH = COMPLIANCE_CONFIRMATION;
const DEMARCHE_COMPLETED = /Votre parcours .* est (désormais )?terminé/;

async function finDeDemarche(
	page: Page,
	options: { url?: string; completed?: boolean } = {},
): Promise<void> {
	await test.step("fin de démarche", async () => {
		if (options.url) {
			await page.waitForURL(options.url, { timeout: 10_000 });
		}
		if (options.completed) {
			await expect(page.getByText(DEMARCHE_COMPLETED)).toBeVisible();
		}
	});
}

// Round 2 leads straight to the joint evaluation, so no corrective wording at all.
async function expectGapJustificationOptions(
	page: Page,
	options: { round: 1 | 2 },
): Promise<void> {
	await test.step("qualification des écarts", async () => {
		for (const title of Object.values(GAP_JUSTIFICATION_TITLES)) {
			await expect(page.getByText(title, { exact: true })).toBeVisible();
		}
		const correctiveAlternative = page.getByText(
			"Soit effectuer des actions correctives et une seconde déclaration",
			{ exact: true },
		);
		const jointObligation = page.getByText(
			"Élaborer le rapport de l'évaluation conjointe et le transmettre",
			{ exact: true },
		);
		if (options.round === 1) {
			await expect(correctiveAlternative).toHaveCount(2);
			await expect(jointObligation).toHaveCount(0);
		} else {
			await expect(jointObligation).toHaveCount(2);
			await expect(correctiveAlternative).toHaveCount(0);
			await expect(
				page.getByText(CORRECTIVE_PATH_TITLE, { exact: true }),
			).toHaveCount(0);
		}
	});
}

const ETAPE_PARCOURS_CONFORMITE =
	"Parcours de mise en conformité pour l'indicateur par catégorie d'emplois";

// #4291 — CAS-01 closes its démarche without ever opening the compliance path,
// and the panel used to derive that step from the company characteristics alone
// (>= 100 salariés owing indicator G), dropping the ">= 5 % gap" conjunct. The
// closed variant therefore showed the step ticked « Étape terminée », claiming a
// parcours this company never had to take.
async function expectPanneauFinDeDemarcheSansParcours(
	page: Page,
): Promise<void> {
	await test.step("panneau « Mon espace » d'une fin de démarche sans parcours", async () => {
		const panel = await openPanneauDemarche(page);
		await expect(panel.getByText("Démarche close")).toBeVisible();
		await expect(panel.getByText(ETAPE_PARCOURS_CONFORMITE)).toHaveCount(0);

		const row = transmittedRow(page, "Votre déclaration a été transmise");
		// Pin the row before reading the negative assertion above as a result: an
		// empty panel would satisfy toHaveCount(0) without proving anything.
		await expect(row).toBeVisible();
		await expect(
			row.getByRole("link", {
				name: "Voir le récapitulatif de la déclaration",
			}),
		).toBeVisible();
	});
}

// #4222 — on a closed démarche the panel used to derive "Modifier" from the
// campaign deadline alone, so it offered edits the FSM then refused. The
// affordance now follows the FSM, which only still accepts a CSE opinion.
async function expectPanneauDemarcheClose(page: Page): Promise<void> {
	await test.step("panneau « Mon espace » d'une démarche close", async () => {
		await openPanneauDemarche(page);

		const readOnlyRows: Array<{ label: string; view: string }> = [
			{
				label: "Votre déclaration a été transmise",
				view: "Voir le récapitulatif de la déclaration",
			},
			{
				label: "Votre seconde déclaration a été transmise",
				view: "Voir le récapitulatif de la seconde déclaration",
			},
			{
				label: "Votre rapport de l'évaluation conjointe a été transmis",
				view: "Voir le rapport de l'évaluation conjointe",
			},
		];

		for (const { label, view } of readOnlyRows) {
			const row = transmittedRow(page, label);
			// Pin the row before the negative assertions below: a missing row would
			// otherwise satisfy every toHaveCount(0) without proving anything.
			await expect(row).toBeVisible();
			await expect(row.getByRole("link", { name: view })).toBeVisible();
			await expect(
				row.getByRole("link", { name: "Modifier", exact: true }),
			).toHaveCount(0);
			await expect(row.getByText(/Modifiable jusqu'au/)).toHaveCount(0);
		}

		const cseRow = transmittedRow(page, "Vos avis du CSE ont été transmis");
		await expect(
			cseRow.getByRole("link", { name: "Voir les avis du CSE" }),
		).toBeVisible();
		await expect(
			cseRow.getByRole("link", { name: "Modifier", exact: true }),
		).toBeVisible();
	});
}

export const FICHE_SCENARIOS = {
	"CAS-01": async ({ page }) => {
		await completeDeclaration(page, { hasGap: false });
		await finDeDemarche(page, {
			url: urlGlob(CONFIRMATION_PATH),
			completed: true,
		});
		// Every field of the /avis-cse funnel is required, so a company without a
		// CSE cannot fill it in — the screen must stay out of reach even by URL.
		await test.step("fin de démarche", async () => {
			await page.goto(cseOpinionStepHref(1));
			await page.waitForURL(urlGlob(CONFIRMATION_PATH), { timeout: 10_000 });
		});
		await expectPanneauFinDeDemarcheSansParcours(page);
	},

	"CAS-02": async ({ page }) => {
		await completeDeclaration(page, { hasGap: false });
		await page.waitForURL(urlGlob(`${CSE_OPINION}/**`), { timeout: 10_000 });
		await fillCseStep1(page);
		await submitCseStep2(page);
		await finDeDemarche(page, { completed: true });
	},

	"CAS-03": async ({ page }) => {
		// Taken before the funnel: the receipt is matched on emails newer than this,
		// so the grid's 185 coordinates can share one Mailpit without clearing it.
		const startedAt = new Date();
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-justify");
		await finDeDemarche(page, {
			url: urlGlob(CONFIRMATION_PATH),
			completed: true,
		});
		// The justify-without-CSE path ends here, so the acknowledgement of #4293 is
		// part of this nominal case — not a case of its own.
		await expectCompletionReceiptWhenMailChainUp({
			round: "first",
			since: startedAt,
		});
	},

	"CAS-04": async ({ page, opinion = "favorable" }) => {
		await completeDeclaration(page, { hasGap: true });
		await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 10_000 });
		await expectGapJustificationOptions(page, { round: 1 });
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL(urlGlob(cseOpinionStepHref(1)), { timeout: 10_000 });
		await fillCseStep1(page, { firstDeclJustification: true, opinion });
		await submitCseStep2(page, {
			columns: [
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 1, type: "gap" },
			],
		});
		await finDeDemarche(page, { completed: true });
	},

	"CAS-05": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await expectGapJustificationOptions(page, { round: 1 });
		await selectCompliancePath(page, "path-joint", {
			gapJustification: "none",
		});
		await uploadJointEvalPdf(page);
		await finDeDemarche(page, { url: urlGlob(CONFIRMATION_PATH) });
	},

	"CAS-06": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL(urlGlob(`${CSE_OPINION}/**`), { timeout: 10_000 });
		await fillCseStep1(page, { firstDeclJustification: true });
		await submitCseStep2(page, {
			columns: [
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 1, type: "gap" },
			],
		});
		await finDeDemarche(page, { completed: true });
	},

	"CAS-07": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: false });
		await finDeDemarche(page, { url: urlGlob(CONFIRMATION_PATH) });
	},

	"CAS-08": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective", {
			gapJustification: "none",
		});
		await completeSecondDeclaration(page, { hasGap: false });
		await page.waitForURL(urlGlob(`${CSE_OPINION}/**`), { timeout: 10_000 });
		await fillCseStep1(page, { hasSecondDeclaration: true });
		await submitCseStep2(page, {
			hasSecondDeclaration: true,
			columns: [
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 2, type: "accuracy" },
			],
		});
		await finDeDemarche(page, { completed: true });
	},

	"CAS-09": async ({ page }) => {
		const startedAt = new Date();
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 10_000 });
		await selectCompliancePath(page, "path-justify");
		await finDeDemarche(page, {
			url: urlGlob(CONFIRMATION_PATH),
			completed: true,
		});
		// Round 2 closes on the same justify-without-CSE transition, so the receipt
		// is the second-declaration one — a round-1 subject here would be the bug.
		await expectCompletionReceiptWhenMailChainUp({
			round: "second",
			since: startedAt,
		});
	},

	"CAS-10": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 10_000 });
		await page.goto(COMPLIANCE_PATH);
		await expectGapJustificationOptions(page, { round: 2 });
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL(urlGlob(cseOpinionStepHref(1)), { timeout: 10_000 });
		await fillCseStep1(page, {
			hasSecondDeclaration: true,
			firstDeclJustification: true,
			secondDeclJustification: true,
		});
		await submitCseStep2(page, {
			hasSecondDeclaration: true,
			columns: [
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 1, type: "gap" },
				{ declarationNumber: 2, type: "accuracy" },
				{ declarationNumber: 2, type: "gap" },
			],
		});
		await finDeDemarche(page, { completed: true });
	},

	"CAS-11": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-joint", {
			gapJustification: "none",
		});
		await uploadJointEvalPdf(page);
		await finDeDemarche(page, { url: urlGlob(CONFIRMATION_PATH) });
	},

	"CAS-12": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL(urlGlob(`${CSE_OPINION}/**`), { timeout: 10_000 });
		await fillCseStep1(page, {
			hasSecondDeclaration: true,
			firstDeclJustification: true,
			secondDeclJustification: true,
		});
		await submitCseStep2(page, {
			hasSecondDeclaration: true,
			columns: [
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 1, type: "gap" },
				{ declarationNumber: 2, type: "accuracy" },
				{ declarationNumber: 2, type: "gap" },
			],
		});
		await finDeDemarche(page, { completed: true });
		await expectPanneauDemarcheClose(page);
	},

	"CAS-01-6IND": async ({ page, coordinate }) => {
		await withCampaignYear(
			{ page, year: coordinate.year, workforce: coordinate.workforce },
			async () => {
				await setCompanyHasCse(false);
				await reachRecapWithoutGap(page, {
					indicatorGRequired: coordinate.indicatorGRequired,
				});
				await expect(
					page.getByText(recapStepperLabel(coordinate.indicatorGRequired), {
						exact: true,
					}),
				).toBeVisible();
				await submitFromStep6Recap(page);
				await finDeDemarche(page, {
					url: urlGlob(CONFIRMATION_PATH),
					completed: true,
				});
			},
		);
	},

	"CAS-02-6IND": async ({ page, coordinate }) => {
		await withCampaignYear(
			{ page, year: coordinate.year, workforce: coordinate.workforce },
			async () => {
				await setCompanyHasCse(true);
				await reachRecapWithoutGap(page, {
					indicatorGRequired: coordinate.indicatorGRequired,
				});
				await submitFromStep6Recap(page);
				await page.waitForURL(urlGlob(`${CSE_OPINION}/**`), {
					timeout: 10_000,
				});
				await fillCseStep1(page);
				await submitCseStep2(page);
				await finDeDemarche(page, { completed: true });
			},
		);
	},

	"CAS-13": async ({ page }) => {
		await reachStep6Recap(page, { hasGap: false });
		await expect(
			page.getByText("Étape 6 sur 6", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: "Indicateur par catégorie d'emplois",
			}),
		).toBeVisible();
		await submitFromStep6Recap(page);
		await finDeDemarche(page, {
			url: urlGlob(CONFIRMATION_PATH),
			completed: true,
		});
	},

	"CAS-14": async ({ page }) => {
		await reachStep6ComplianceRecap(page);
		// Same gap inputs that render "Prochaines étapes" at 200 salariés: below
		// 100 nothing is due, so the box is absent altogether.
		await expect(
			page.getByRole("heading", { name: "Prochaines étapes" }),
		).toHaveCount(0);
		await expect(
			page.getByText("Écarts détectés", { exact: true }),
		).toHaveCount(0);
		await expect(
			page.getByRole("heading", { name: "Actions à engager" }),
		).toHaveCount(0);

		await page.goto(remunerationStepHref(6));
		await submitFromStep6Recap(page);
		await finDeDemarche(page, {
			url: urlGlob(CONFIRMATION_PATH),
			completed: true,
		});

		// The compliance path choice is unreachable even by URL: below 100 salariés
		// a gap ≥ 5 % opens none of the compliance surfaces.
		await page.goto(COMPLIANCE_PATH);
		await page.waitForURL(urlGlob(CONFIRMATION_PATH), { timeout: 10_000 });

		// Declaring a CSE leaves the effectif as the only unmet term of
		// isCseOpinionRequired, so this probe fails if the 100-salarié gate goes away.
		await setCompanyHasCse(true);
		const cseFunnelResponse = await page.goto(cseOpinionStepHref(1));
		expect(cseFunnelResponse?.ok()).toBe(true);
		expect(new URL(page.url()).pathname).toBe(CONFIRMATION_PATH);
		await expect(
			page.getByRole("heading", {
				name: "Transmission du ou des avis du CSE",
			}),
		).toHaveCount(0);
		await expect(page.locator("#first-decl-accuracy-favorable")).toHaveCount(0);
		await expect(page.getByText(DEMARCHE_COMPLETED)).toBeVisible();
	},

	"CAS-13-6IND": async ({ page, coordinate }) => {
		const indicatorGRequired = coordinate.indicatorGRequired;
		await page.goto(remunerationStepHref(5));
		if (indicatorGRequired) {
			await expect(page).toHaveURL(urlPattern(remunerationStepHref(5)));
			await expect(
				page.getByRole("heading", {
					name: /Écart de rémunération par catégorie d'emplois/,
				}),
			).toBeVisible();
		} else {
			// Off those years step 5 is out of reach even by URL — unlike the < 50
			// tier, which always carries it.
			await expect(page).toHaveURL(urlPattern(remunerationStepHref(6)));
		}

		await reachRecapWithoutGap(page, { indicatorGRequired });
		await expect(
			page.getByText(recapStepperLabel(indicatorGRequired), { exact: true }),
		).toBeVisible();
		await submitFromStep6Recap(page);
		await finDeDemarche(page, {
			url: urlGlob(CONFIRMATION_PATH),
			completed: true,
		});
	},
} satisfies Record<string, (ctx: ScenarioContext) => Promise<void>>;
