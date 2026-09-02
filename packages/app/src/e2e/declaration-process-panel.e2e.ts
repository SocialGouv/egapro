import { expect, type Page, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";
import { TEST_USER_PHONE } from "./constants";
import {
	pinCampaignYear,
	setServerCampaignYear,
} from "./helpers/campaign-year";
import {
	deleteCseOpinions,
	deleteJointEvaluationFiles,
	ensureCurrentYearDeclaration,
	insertCseOpinion,
	insertJointEvaluationFile,
	resetDeclarationToDraft,
	resetGipWorkforce,
	seedDeclarationForYear,
	setCompanyHasCse,
	setDeclarationComplianceState,
	setGipWorkforce,
	setUserPhone,
} from "./helpers/db";
import {
	resetCampaignYear as resetCampaignYearData,
	setCampaignDeadlines,
} from "./helpers/db-campaign";
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./helpers/dsfr";
import { loginWithProConnect } from "./helpers/login";

// Per-variant panel rendering is covered by my-space/__tests__/DeclarationProcessPanel.test.tsx.

const PANEL_ID = "declaration-process-panel";
// Matches the year the panel renders and the year ensureCurrentYearDeclaration inserts.
const CURRENT_YEAR = getCurrentYear();

test.describe("Declaration process panel", () => {
	test.describe.configure({ mode: "serial" });
	test.setTimeout(90_000);

	test.afterAll(async () => {
		await resetDeclarationToDraft();
		await deleteJointEvaluationFiles();
		await deleteCseOpinions();
		await setCompanyHasCse(true);
		await setUserPhone(TEST_USER_PHONE);
	});

	test.describe("DB state → variant: closed (compliance completed + CSE deposited)", () => {
		test.beforeAll(async () => {
			await setDeclarationComplianceState({
				status: "demarche_completed",
				firstDeclarationPathChoice: "joint_evaluation",
				demarcheCompletedAt: new Date(),
				cseOpinionCompletedAt: new Date(),
			});
			await insertJointEvaluationFile(CURRENT_YEAR);
			await insertCseOpinion(CURRENT_YEAR);
		});

		test("shows closed variant with démarche close message", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await waitForDsfrModal(page, PANEL_ID);

			const panel = page.locator(`#${PANEL_ID}`);
			const remuButton = page.getByRole("button", { name: "Rémunération" });
			await expect(remuButton.first()).toBeVisible();
			await clickAndExpectDialogOpen(page, remuButton.first(), PANEL_ID);

			await expect(panel.getByText("Démarche close")).toBeVisible();
			await expect(
				panel.getByText(
					"Cette démarche est terminée. Les avis du CSE restent modifiables jusqu'à l'échéance.",
				),
			).toBeVisible();

			// #4243: step 1 announces the transmitted declaration on every path,
			// a closed démarche included, and keeps its view button.
			await expect(
				panel.getByText("Votre déclaration a été transmise"),
			).toBeVisible();
			await expect(
				panel.getByTitle("Voir le récapitulatif de la déclaration"),
			).toBeVisible();
		});
	});

	test.describe("Opens after missing info modal save", () => {
		test.beforeAll(async () => {
			await resetDeclarationToDraft();
			await setCompanyHasCse(null);
			await setUserPhone(TEST_USER_PHONE);
		});

		test.afterAll(async () => {
			await setCompanyHasCse(true);
		});

		test("missing info modal save opens the panel for remuneration", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await waitForDsfrModal(page, PANEL_ID);

			const modal = page.locator("#missing-info-modal");
			const panel = page.locator(`#${PANEL_ID}`);

			const remuButton = page.getByRole("button", { name: "Rémunération" });
			await expect(remuButton.first()).toBeVisible();
			await clickAndExpectDialogOpen(
				page,
				remuButton.first(),
				"missing-info-modal",
			);

			await modal.locator("label[for='missing-info-cse-yes']").click();
			await modal.getByRole("button", { name: "Enregistrer" }).click();

			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });
			await expect(
				panel.getByText(
					`Démarche des indicateurs de rémunération ${CURRENT_YEAR}`,
				),
			).toBeVisible();
		});
	});

	// Regressions #3939 and #4275: a voluntary company without CSE must never see the
	// "déposer l'avis CSE" step — neither during the démarche nor after completion (where
	// the panel used to stay stuck on "avis CSE en cours" with a /avis-cse CTA). Although
	// voluntary declarations carry indicator G, their workforce keeps the compliance path
	// inapplicable. Absence from the GIP file also means the indicators are not prefilled.
	test.describe("voluntary company without CSE: compliance and CSE steps are hidden", () => {
		const STEP2_TITLE =
			"Parcours de mise en conformité pour l'indicateur par catégories de salariés";
		const STEP3_TITLE = "Déposer le ou les avis du CSE";

		test.afterAll(async () => {
			await resetDeclarationToDraft();
			await resetGipWorkforce();
			await setCompanyHasCse(true);
		});

		async function openPanel(page: Parameters<typeof loginWithProConnect>[0]) {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await waitForDsfrModal(page, PANEL_ID);
			const remuButton = page.getByRole("button", { name: "Rémunération" });
			await expect(remuButton.first()).toBeVisible();
			await clickAndExpectDialogOpen(page, remuButton.first(), PANEL_ID);
		}

		test.describe("during the démarche (draft)", () => {
			test.beforeAll(async () => {
				await ensureCurrentYearDeclaration();
				await setGipWorkforce(null);
				await setCompanyHasCse(false);
				await setUserPhone(TEST_USER_PHONE);
				await resetDeclarationToDraft();
			});

			test("announces manual indicators without compliance or CSE steps", async ({
				page,
			}) => {
				await openPanel(page);
				const panel = page.locator(`#${PANEL_ID}`);

				await expect(
					panel.getByText("Déclaration des indicateurs de rémunération"),
				).toBeVisible();
				await expect(
					panel.getByText("Indicateurs pour l'ensemble des salariés à remplir"),
				).toBeVisible();
				await expect(panel.getByText(STEP2_TITLE)).toHaveCount(0);
				await expect(panel.getByText(STEP3_TITLE)).toHaveCount(0);
			});
		});

		test.describe("after completion (démarche_completed, not subject)", () => {
			test.beforeAll(async () => {
				await ensureCurrentYearDeclaration();
				await setGipWorkforce(null);
				await setCompanyHasCse(false);
				await setUserPhone(TEST_USER_PHONE);
				await setDeclarationComplianceState({
					status: "demarche_completed",
					demarcheCompletedAt: new Date(),
					cseRequired: false,
				});
			});

			test("closed variant without any CSE deposit prompt or CTA", async ({
				page,
			}) => {
				await openPanel(page);
				const panel = page.locator(`#${PANEL_ID}`);

				await expect(panel.getByText("Démarche close")).toBeVisible();
				await expect(
					panel.getByText("Cette démarche est terminée.", { exact: true }),
				).toBeVisible();
				await expect(
					panel.getByText(
						"Cette démarche est terminée. Les avis du CSE restent modifiables jusqu'à l'échéance.",
					),
				).toHaveCount(0);
				await expect(panel.getByText(STEP3_TITLE)).toHaveCount(0);
				await expect(panel.getByText(STEP2_TITLE)).toHaveCount(0);
				await expect(
					panel.getByText("Votre déclaration a été transmise"),
				).toBeVisible();
				await expect(
					panel.getByTitle("Voir le récapitulatif de la déclaration"),
				).toBeVisible();

				const cta = panel.getByRole("link", { name: "Voir la déclaration" });
				await expect(cta).toBeVisible();
				await expect(cta).not.toHaveAttribute("href", /avis-cse/);
			});
		});
	});

	// #3939 follow-up: a GIP-derived >= 100 company that declared "sans CSE" is still
	// subject to indicator G, so the panel shows the indicator-G path step (step 2)
	// during the démarche — but must never ask it to deposit a CSE opinion — step 3
	// and the "avis CSE modifiables" closing note are hidden, both during the démarche
	// and after completion. Step 3 visibility is driven by
	// isCseOpinionRequired({ workforce, hasCse }), not the workforce alone, so this
	// differs from the < 100 case where step 2 is hidden too.
	// #4291 follow-up: step 2 itself is not simply gated by company size any more —
	// once `demarche_completed` is reached with no compliance path ever chosen, the
	// démarche skipped it (the ≥5% gap never applied) and it disappears from the
	// closed panel too. It only survives past completion when a path was actually
	// chosen (see `isCompliancePathStepApplicable`).
	test.describe("GIP >= 100 without CSE: indicator-G step shown, CSE step hidden", () => {
		const STEP2_TITLE =
			"Parcours de mise en conformité pour l'indicateur par catégories de salariés";
		const STEP3_TITLE = "Déposer le ou les avis du CSE";

		test.afterAll(async () => {
			await resetDeclarationToDraft();
			await resetGipWorkforce();
			await setCompanyHasCse(true);
		});

		async function openPanel(page: Parameters<typeof loginWithProConnect>[0]) {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await waitForDsfrModal(page, PANEL_ID);
			const remuButton = page.getByRole("button", { name: "Rémunération" });
			await expect(remuButton.first()).toBeVisible();
			await clickAndExpectDialogOpen(page, remuButton.first(), PANEL_ID);
		}

		test.describe("during the démarche (draft)", () => {
			test.beforeAll(async () => {
				await ensureCurrentYearDeclaration();
				await resetGipWorkforce();
				await setCompanyHasCse(false);
				await setUserPhone(TEST_USER_PHONE);
				await resetDeclarationToDraft();
			});

			test("the indicator-G step is announced but not the CSE step", async ({
				page,
			}) => {
				await openPanel(page);
				const panel = page.locator(`#${PANEL_ID}`);

				await expect(
					panel.getByText("Déclaration des indicateurs de rémunération"),
				).toBeVisible();
				await expect(panel.getByText(STEP2_TITLE)).toBeVisible();
				await expect(panel.getByText(STEP3_TITLE)).toHaveCount(0);
			});
		});

		test.describe("after completion (démarche_completed, no CSE opinion due)", () => {
			test.beforeAll(async () => {
				await ensureCurrentYearDeclaration();
				await resetGipWorkforce();
				await setCompanyHasCse(false);
				await setUserPhone(TEST_USER_PHONE);
				await setDeclarationComplianceState({
					status: "demarche_completed",
					demarcheCompletedAt: new Date(),
					cseRequired: false,
				});
			});

			test("closed variant without any CSE deposit prompt or CTA", async ({
				page,
			}) => {
				await openPanel(page);
				const panel = page.locator(`#${PANEL_ID}`);

				await expect(panel.getByText("Démarche close")).toBeVisible();
				await expect(
					panel.getByText("Cette démarche est terminée.", { exact: true }),
				).toBeVisible();
				await expect(
					panel.getByText(
						"Cette démarche est terminée. Les avis du CSE restent modifiables jusqu'à l'échéance.",
					),
				).toHaveCount(0);
				await expect(panel.getByText(STEP3_TITLE)).toHaveCount(0);

				const cta = panel.getByRole("link", { name: "Voir la déclaration" });
				await expect(cta).toBeVisible();
				await expect(cta).not.toHaveAttribute("href", /avis-cse/);
			});
		});
	});
});

// #4083 — the Ressources cell of the same row gated both recap PDFs on the
// *démarche* status, which computeDeclarationStatus only reports as "done" on the
// terminal demarche_completed. A submitted declaration therefore lost its recap in
// the 7 other post-submission FSM states, while the process panel above already
// linked it. The guard now reads "the declaration is submitted", pinned here end
// to end — seeded FSM state → server payload → cell count → panel → an endpoint
// that really returns the PDF — which the DocumentsPanel unit tests cannot observe.
//
// #4209 — submission alone no longer opens the *transmitted* recap: that PDF only
// ever carries CSE opinions and the joint evaluation file, so before the démarche
// produces one it rendered as empty blocks. Both branches are seeded from real
// rows, because the server derives the two flags gating it from app_file and the
// status history, not from the declaration record the unit tests hand the panel.
test.describe("Mon espace — Ressources cell of the rémunération row", () => {
	test.describe.configure({ mode: "serial" });
	test.setTimeout(90_000);

	const DOCUMENTS_PANEL_ID = `documents-panel-remuneration-${CURRENT_YEAR}`;
	const PREFILL_TITLE =
		"Télécharger les données préremplies (issues des données DSN)";
	const RECAP_INDICATORS_TITLE =
		"Télécharger le récapitulatif de la déclaration des indicateurs";
	const RECAP_TRANSMITTED_TITLE =
		"Télécharger le récapitulatif des éléments transmis";

	test.beforeAll(async () => {
		await ensureCurrentYearDeclaration();
		await resetGipWorkforce();
		await setCompanyHasCse(true);
		await setUserPhone("0122334455");
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
	});

	// Scoped to the cell: the panel's own "Fermer" button carries the same
	// aria-controls, so an unscoped attribute selector matches two elements.
	function documentsTrigger(page: Page) {
		return page.locator(`td > button[aria-controls="${DOCUMENTS_PANEL_ID}"]`);
	}

	async function openDocumentsPanel(page: Page) {
		await page.goto("/mon-espace");
		await expect(documentsTrigger(page)).toBeVisible();
		await waitForDsfrModal(page, DOCUMENTS_PANEL_ID);
		await clickAndExpectDialogOpen(
			page,
			documentsTrigger(page),
			DOCUMENTS_PANEL_ID,
		);
		return page.locator(`#${DOCUMENTS_PANEL_ID}`);
	}

	test.describe("declaration submitted, nothing transmitted yet", () => {
		test.beforeAll(async () => {
			await setDeclarationComplianceState({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
			});
			await deleteJointEvaluationFiles();
			await deleteCseOpinions();
		});

		test("the indicators recap sits next to the prefill file, and the transmitted recap stays out until it has content", async ({
			page,
		}) => {
			const panel = await openDocumentsPanel(page);

			await expect(documentsTrigger(page)).toHaveText("Documents (2)");

			const indicatorsHref = `/api/declaration-pdf?year=${CURRENT_YEAR}`;

			await expect(
				panel.getByRole("link", { name: PREFILL_TITLE }),
			).toBeVisible();
			await expect(
				panel.getByRole("link", { name: RECAP_INDICATORS_TITLE }),
			).toHaveAttribute("href", indicatorsHref);
			await expect(
				panel.getByRole("link", { name: RECAP_TRANSMITTED_TITLE }),
			).toHaveCount(0);

			const response = await page.request.get(indicatorsHref, {
				timeout: 30_000,
			});
			expect(response.status(), `GET ${indicatorsHref}`).toBe(200);
			expect(response.headers()["content-type"]).toContain("pdf");
		});
	});

	test.describe("joint evaluation path chosen, its file deposited", () => {
		test.beforeAll(async () => {
			await setDeclarationComplianceState({
				status: "joint_evaluation_chosen",
				currentStep: 6,
				firstDeclarationPathChoice: "joint_evaluation",
			});
			await insertJointEvaluationFile(CURRENT_YEAR);
		});

		test.afterAll(async () => {
			await deleteJointEvaluationFiles();
		});

		test("the transmitted recap joins the two others, and its endpoint serves a PDF", async ({
			page,
		}) => {
			const panel = await openDocumentsPanel(page);

			await expect(documentsTrigger(page)).toHaveText("Documents (3)");

			const transmittedHref = `/api/transmitted-pdf?year=${CURRENT_YEAR}`;

			await expect(
				panel.getByRole("link", { name: RECAP_TRANSMITTED_TITLE }),
			).toHaveAttribute("href", transmittedHref);

			const response = await page.request.get(transmittedHref, {
				timeout: 30_000,
			});
			expect(response.status(), `GET ${transmittedHref}`).toBe(200);
			expect(response.headers()["content-type"]).toContain("pdf");
		});
	});

	test.describe("declaration still a draft", () => {
		test.beforeAll(async () => {
			await resetDeclarationToDraft();
		});

		test("only the prefill file is offered — neither recap leaks before submission", async ({
			page,
		}) => {
			const panel = await openDocumentsPanel(page);

			await expect(documentsTrigger(page)).toHaveText("Documents (1)");
			await expect(
				panel.getByRole("link", { name: PREFILL_TITLE }),
			).toBeVisible();
			await expect(
				panel.getByRole("link", { name: RECAP_INDICATORS_TITLE }),
			).toHaveCount(0);
			await expect(
				panel.getByRole("link", { name: RECAP_TRANSMITTED_TITLE }),
			).toHaveCount(0);
		});
	});
});

// Closure badges of the "Années précédentes" table (#3759). The projection is a second pass laid
// over computeDeclarationStatus, and only a real past-year row exercises it end to end: the
// campaign year comes from the pinned clock, while the step deadline is resolved on the row's OWN
// year — from app_campaign_deadline when a row exists, from the domain defaults when it does not.
// Those two resolutions have to agree across getWithDeclarations, buildDeclarationList and the
// badge, which is precisely what no unit test can observe. Per-status projection is covered by
// domain/__tests__/declarationStatus.test.ts, per-variant markup by StatusBadge.test.tsx.
const CLOSURE_PINNED_YEAR = 2031;
const YEAR_CLOSED_NOT_DONE = 2021;
const YEAR_CLOSED_INCOMPLETE = 2022;
const YEAR_STILL_OPEN = 2023;
const YEAR_DONE = 2024;

const REAL_PAST_DEADLINES = {
	decl1ModificationDeadline: "2020-06-01",
	decl1JustificationDeadline: "2020-06-01",
	decl1JointEvaluationDeadline: "2020-08-01",
	decl2ModificationDeadline: "2020-12-01",
	decl2JustificationDeadline: "2020-12-01",
	decl2JointEvaluationDeadline: "2021-01-01",
	decl2CseOpinionDeadline: "2021-02-01",
} as const;

const OPEN_CSE_OPINION_DEADLINES = {
	...REAL_PAST_DEADLINES,
	decl2CseOpinionDeadline: "2099-02-01",
} as const;

test.describe("Mon espace — closure badges of the previous-years table", () => {
	test.describe.configure({ mode: "serial" });
	test.setTimeout(90_000);

	const SEEDED_YEARS = [
		YEAR_CLOSED_NOT_DONE,
		YEAR_CLOSED_INCOMPLETE,
		YEAR_STILL_OPEN,
		YEAR_DONE,
		CLOSURE_PINNED_YEAR,
	];

	test.beforeAll(async () => {
		for (const year of SEEDED_YEARS) {
			await resetCampaignYearData(year);
		}
		// YEAR_CLOSED_NOT_DONE deliberately gets no app_campaign_deadline row: its closure has to
		// fall back on getDefaultCampaignDeadlines(), whose modification deadline for that year is
		// already behind the wall clock. The other two closed-side years carry an explicit row, so
		// the DB branch of the resolution is exercised too.
		await setCampaignDeadlines(YEAR_CLOSED_INCOMPLETE, REAL_PAST_DEADLINES);
		await setCampaignDeadlines(YEAR_STILL_OPEN, OPEN_CSE_OPINION_DEADLINES);
		// The pinned year gets the same expired deadlines as the closed rows, so the "current year
		// is never closed" assertion below bites on the year guard rather than on the deadline one.
		await setCampaignDeadlines(CLOSURE_PINNED_YEAR, REAL_PAST_DEADLINES);
		await seedDeclarationForYear(CLOSURE_PINNED_YEAR, "draft", 0);
		await seedDeclarationForYear(YEAR_CLOSED_NOT_DONE, "draft", 0);
		await seedDeclarationForYear(
			YEAR_CLOSED_INCOMPLETE,
			"corrective_actions_chosen",
			6,
		);
		await seedDeclarationForYear(YEAR_STILL_OPEN, "awaiting_cse_opinion", 6);
		await seedDeclarationForYear(YEAR_DONE, "demarche_completed", 6);
		await setCompanyHasCse(true);
		await setUserPhone(TEST_USER_PHONE);
	});

	test.afterAll(async () => {
		// The server clock override lives on the Node process and outlives the page, so it goes
		// first: any later unpinned spec would otherwise keep reading CLOSURE_PINNED_YEAR (#4067).
		await setServerCampaignYear(null);
		for (const year of SEEDED_YEARS) {
			await resetCampaignYearData(year);
		}
		// resetCampaignYearData flattens the two app_company columns, which are not year-scoped.
		await resetGipWorkforce();
		await setCompanyHasCse(true);
		await setUserPhone(TEST_USER_PHONE);
	});

	function previousYearBadge(page: Page, year: number) {
		return page
			.locator('table[aria-labelledby="annees-precedentes-title"] tbody tr')
			.filter({ has: page.locator(`td:nth-child(2):text-is("${year}")`) })
			.locator(".fr-badge");
	}

	test("a past year past its own step deadline is closed, one still inside it is not", async ({
		page,
	}) => {
		await pinCampaignYear(page, CLOSURE_PINNED_YEAR);
		await page.goto("/mon-espace");
		await expect(
			page.getByRole("heading", { name: "Années précédentes" }),
		).toBeVisible();

		await test.step("started, never finalised, deadline passed → Clôturée - incomplète", async () => {
			const badge = previousYearBadge(page, YEAR_CLOSED_INCOMPLETE);
			await expect(badge).toHaveText("Clôturée - incomplète");
			await expect(badge).toHaveClass(/fr-badge--warning/);
		});

		await test.step("draft never filled in, closed on the domain default deadlines → Clôturée - non effectuée", async () => {
			const badge = previousYearBadge(page, YEAR_CLOSED_NOT_DONE);
			await expect(badge).toHaveText("Clôturée - non effectuée");
			await expect(badge).toHaveClass(/fr-badge--error/);
		});

		await test.step("past year whose CSE-opinion deadline is still open keeps its badge", async () => {
			await expect(previousYearBadge(page, YEAR_STILL_OPEN)).toHaveText(
				"En cours",
			);
		});

		await test.step("a finalised démarche stays Effectué whatever the deadline", async () => {
			await expect(previousYearBadge(page, YEAR_DONE)).toHaveText("Effectué");
		});

		await test.step("the current year is never closed, expired deadlines included", async () => {
			const currentYearBadge = page
				.locator('table[aria-labelledby="demarches-en-cours-title"] tbody tr')
				.filter({ has: page.getByText("Rémunération", { exact: true }) })
				.filter({
					has: page.locator(
						`td:nth-child(2):text-is("${CLOSURE_PINNED_YEAR}")`,
					),
				})
				.locator(".fr-badge");
			await expect(currentYearBadge).toHaveText("À compléter");
		});
	});
});
