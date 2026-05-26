import { expect, test } from "@playwright/test";

import {
	deleteFunnelDeclarations,
	seedFunnelDeclarations,
} from "./helpers/db-funnel";

// 9-digit SIRENs reserved for this E2E only — chosen outside any legitimate
// range so we don't collide with real data.
const SIRENS = {
	main: "999500001",
	compliance: "999500002",
	revision: "999500003",
	cse: "999500004",
} as const;

const K19_YEAR = 2024;

test.describe("admin platform funnel stats (K19)", () => {
	test.beforeAll(async () => {
		await seedFunnelDeclarations([
			// Main funnel only: draft → indicators → submitted → completed.
			{
				siren: SIRENS.main,
				year: K19_YEAR,
				workforce: 30,
				maxStepRound: 6,
				status: "demarche_completed",
				demarcheComplete: true,
			},
			// Compliance funnel: alert triggered + path chosen + corrective +
			// completed.
			{
				siren: SIRENS.compliance,
				year: K19_YEAR,
				workforce: 250,
				maxStepRound: 6,
				status: "demarche_completed",
				firstDeclarationPathChoice: "corrective_action",
				pathChoices: [{ round: 1, pathValue: "corrective_action" }],
				correctiveSubmits: [
					{ eventType: "second_declaration_submit", round: 1 },
				],
				demarcheComplete: true,
			},
			// Revision cycle: compliance path AND a 2nd revision cycle.
			{
				siren: SIRENS.revision,
				year: K19_YEAR,
				workforce: 250,
				maxStepRound: 6,
				status: "demarche_completed",
				firstDeclarationPathChoice: "joint_evaluation",
				pathChoices: [
					{ round: 1, pathValue: "joint_evaluation" },
					{ round: 2, pathValue: "joint_evaluation" },
				],
				correctiveSubmits: [
					{ eventType: "joint_evaluation_submit", round: 1 },
					{ eventType: "joint_evaluation_submit", round: 2 },
				],
				demarcheComplete: true,
			},
			// CSE funnel: company with has_cse=true that submitted a CSE opinion
			// and went through the full demarche.
			{
				siren: SIRENS.cse,
				year: K19_YEAR,
				workforce: 250,
				maxStepRound: 6,
				status: "demarche_completed",
				hasCse: true,
				cseOpinionSubmit: true,
				demarcheComplete: true,
			},
		]);
	});

	test.afterAll(async () => {
		await deleteFunnelDeclarations(Object.values(SIRENS));
	});

	test("S-K19-E1: admin can open the platform stats page and sees the four funnel sections", async ({
		page,
	}) => {
		await page.goto("/admin/stats/plateforme");

		await expect(
			page.getByRole("heading", { name: "Statistiques plateforme", level: 1 }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: /Funnel principal/i,
				level: 2,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: /Funnel parcours conformité/i,
				level: 2,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: /Funnel cycle de révision/i,
				level: 2,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: /Funnel cycle CSE/i,
				level: 2,
			}),
		).toBeVisible();
	});

	test("S-K19-E2: each funnel has its own accessible alternative table scoped to its section", async ({
		page,
	}) => {
		await page.goto("/admin/stats/plateforme");
		await page.getByLabel("Année de campagne").selectOption(String(K19_YEAR));

		// Wait for at least one funnel figure to render.
		await expect(page.locator("figure").first()).toBeVisible();

		const mainSection = page.getByLabel(
			"Funnel principal — toutes les déclarations",
		);
		const complianceSection = page.getByLabel(
			"Funnel parcours conformité — déclarations avec écart ≥ 5 %",
		);
		const revisionSection = page.getByLabel(
			/Funnel cycle de révision — déclarations ayant nécessité une révision/i,
		);

		await mainSection
			.locator("summary", {
				hasText: /Consulter les données du graphique sous forme de tableau/i,
			})
			.click();
		await complianceSection
			.locator("summary", {
				hasText: /Consulter les données du graphique sous forme de tableau/i,
			})
			.click();
		await revisionSection
			.locator("summary", {
				hasText: /Consulter les données du graphique sous forme de tableau/i,
			})
			.click();

		await expect(
			mainSection.getByRole("rowheader", { name: "Brouillon créé" }),
		).toBeVisible();
		await expect(
			complianceSection.getByRole("rowheader", {
				name: /Soumise \(écart ≥ 5 %\)/i,
			}),
		).toBeVisible();
		await expect(
			revisionSection.getByRole("rowheader", { name: "Révision requise" }),
		).toBeVisible();
	});

	test("S-K19-E3: filtering by size range still renders the page without crashing", async ({
		page,
	}) => {
		await page.goto("/admin/stats/plateforme");
		await page.getByLabel("Tranche d'effectif").selectOption("250+");

		await expect(
			page.getByRole("heading", { name: /Funnel principal/i, level: 2 }),
		).toBeVisible();
	});

	test("S-K19-E5: the CSE funnel exposes the cse_opinion_submitted jalon in its accessible table", async ({
		page,
	}) => {
		await page.goto("/admin/stats/plateforme");
		await page.getByLabel("Année de campagne").selectOption(String(K19_YEAR));

		await expect(
			page.getByRole("heading", { name: /Funnel cycle CSE/i, level: 2 }),
		).toBeVisible();

		const cseSection = page.getByLabel(
			/Funnel cycle CSE — déclarations d'entreprises ayant un CSE/i,
		);

		await cseSection
			.locator("summary", {
				hasText: /Consulter les données du graphique sous forme de tableau/i,
			})
			.click();

		await expect(
			cseSection.getByRole("rowheader", { name: "Avis CSE soumis" }),
		).toBeVisible();
	});

	test("S-K19-E4: the revision section shows an empty message when no declaration is in revision for the filters", async ({
		page,
	}) => {
		await page.goto("/admin/stats/plateforme");
		// Switch to a year with no seed → revision funnel is empty.
		await page.getByLabel("Année de campagne").selectOption(String(2018));

		await expect(
			page.getByRole("heading", {
				name: /Funnel cycle de révision/i,
				level: 2,
			}),
		).toBeVisible();
		await expect(
			page.getByText(/Aucune révision pour ces filtres/i),
		).toBeVisible();
	});
});

test("non-admin users are redirected away from the plateforme stats page", async ({
	browser,
}) => {
	const anonCtx = await browser.newContext({ storageState: undefined });
	try {
		const page = await anonCtx.newPage();
		await page.goto("/admin/stats/plateforme");
		await expect(page).toHaveURL(/\/login/);
	} finally {
		await anonCtx.close();
	}
});
