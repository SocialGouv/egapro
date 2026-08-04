import { expect, type Page, test } from "@playwright/test";
import { withCampaignYear } from "../helpers/campaign-year";
import {
	COMPLIANCE_PATH,
	completeSecondDeclaration,
	fillCseStep1,
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
import type { Coordinate } from "./coordinates";

export type ScenarioContext = {
	page: Page;
	coordinate: Coordinate;
	/** Opinion axis for CSE accuracy and gap steps. Defaults to "favorable" — the grid always runs in favorable mode. */
	opinion?: "favorable" | "unfavorable";
};

const CONFIRMATION_PATH = `${COMPLIANCE_PATH}/confirmation`;
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

async function expectComplianceOptions(
	page: Page,
	options: { corrective: boolean; joint: boolean; justify: boolean },
): Promise<void> {
	await test.step("choix du parcours de conformité", async () => {
		const corrective = page.getByText(
			"Effectuer des actions correctives et une seconde déclaration",
			{ exact: true },
		);
		const joint = page.getByText(
			"Mettre en place une évaluation conjointe des rémunérations",
			{ exact: true },
		);
		const justify = page.getByText(
			"Justifier les écarts de rémunération ≥ 5 %",
			{
				exact: true,
			},
		);
		await (options.corrective
			? expect(corrective).toBeVisible()
			: expect(corrective).not.toBeVisible());
		if (options.joint) await expect(joint).toBeVisible();
		if (options.justify) await expect(justify).toBeVisible();
	});
}

export const FICHE_SCENARIOS = {
	"CAS-01": async ({ page }) => {
		await completeDeclaration(page, { hasGap: false });
		await finDeDemarche(page, {
			url: `**${CONFIRMATION_PATH}`,
			completed: true,
		});
		// Every field of the /avis-cse funnel is required, so a company without a
		// CSE cannot fill it in — the screen must stay out of reach even by URL.
		await test.step("fin de démarche", async () => {
			await page.goto("/avis-cse/etape/1");
			await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
		});
	},

	"CAS-02": async ({ page }) => {
		await completeDeclaration(page, { hasGap: false });
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
		await fillCseStep1(page);
		await submitCseStep2(page);
		await finDeDemarche(page, { completed: true });
	},

	"CAS-03": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-justify");
		await finDeDemarche(page, {
			url: `**${CONFIRMATION_PATH}`,
			completed: true,
		});
	},

	"CAS-04": async ({ page, opinion = "favorable" }) => {
		await completeDeclaration(page, { hasGap: true });
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
		await expectComplianceOptions(page, {
			corrective: true,
			joint: true,
			justify: true,
		});
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });
		await fillCseStep1(page, { firstDeclGapConsulted: true, opinion });
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
		await expectComplianceOptions(page, {
			corrective: true,
			joint: true,
			justify: true,
		});
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await finDeDemarche(page, { url: `**${CONFIRMATION_PATH}` });
	},

	"CAS-06": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
		await fillCseStep1(page);
		await submitCseStep2(page);
		await finDeDemarche(page, { completed: true });
	},

	"CAS-07": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: false });
		await finDeDemarche(page, { url: `**${CONFIRMATION_PATH}` });
	},

	"CAS-08": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: false });
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
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
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
		await selectCompliancePath(page, "path-justify");
		await finDeDemarche(page, {
			url: `**${CONFIRMATION_PATH}`,
			completed: true,
		});
	},

	"CAS-10": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
		await page.goto(COMPLIANCE_PATH);
		await expectComplianceOptions(page, {
			corrective: false,
			joint: true,
			justify: true,
		});
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });
		await fillCseStep1(page, {
			hasSecondDeclaration: true,
			secondDeclGapConsulted: true,
		});
		await submitCseStep2(page, {
			hasSecondDeclaration: true,
			columns: [
				{ declarationNumber: 1, type: "accuracy" },
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
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await finDeDemarche(page, { url: `**${CONFIRMATION_PATH}` });
	},

	"CAS-12": async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
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
					url: `**${CONFIRMATION_PATH}`,
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
				await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
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
				name: "Indicateurs par catégorie de salariés",
			}),
		).toBeVisible();
		await submitFromStep6Recap(page);
		await finDeDemarche(page, {
			url: `**${CONFIRMATION_PATH}`,
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

		await page.goto("/declaration-remuneration/etape/6");
		await submitFromStep6Recap(page);
		await finDeDemarche(page, {
			url: `**${CONFIRMATION_PATH}`,
			completed: true,
		});

		// The compliance path choice is unreachable even by URL: below 100 salariés
		// a gap ≥ 5 % opens none of the compliance surfaces.
		await page.goto(COMPLIANCE_PATH);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });

		// Declaring a CSE leaves the effectif as the only unmet term of
		// isCseOpinionRequired, so this probe fails if the 100-salarié gate goes away.
		await setCompanyHasCse(true);
		const cseFunnelResponse = await page.goto("/avis-cse/etape/1");
		expect(cseFunnelResponse?.ok()).toBe(true);
		expect(new URL(page.url()).pathname).toBe(CONFIRMATION_PATH);
		await expect(
			page.getByRole("heading", {
				name: "Transmettre l'avis ou les avis du CSE",
			}),
		).toHaveCount(0);
		await expect(page.locator("#first-decl-accuracy-favorable")).toHaveCount(0);
		await expect(page.getByText(DEMARCHE_COMPLETED)).toBeVisible();
	},

	"CAS-13-6IND": async ({ page, coordinate }) => {
		const indicatorGRequired = coordinate.indicatorGRequired;
		await page.goto("/declaration-remuneration/etape/5");
		if (indicatorGRequired) {
			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/5$/);
			await expect(
				page.getByRole("heading", {
					name: /Écart de rémunération par catégories de salariés/,
				}),
			).toBeVisible();
		} else {
			// Off those years step 5 is out of reach even by URL — unlike the < 50
			// tier, which always carries it.
			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/6$/);
		}

		await reachRecapWithoutGap(page, { indicatorGRequired });
		await expect(
			page.getByText(recapStepperLabel(indicatorGRequired), { exact: true }),
		).toBeVisible();
		await submitFromStep6Recap(page);
		await finDeDemarche(page, {
			url: `**${CONFIRMATION_PATH}`,
			completed: true,
		});
	},
} satisfies Record<string, (ctx: ScenarioContext) => Promise<void>>;
