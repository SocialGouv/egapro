import { expect, type Page, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";
import { TEST_USER_PHONE } from "./constants";
import {
	deleteCseOpinions,
	deleteJointEvaluationFiles,
	ensureCurrentYearDeclaration,
	insertCseOpinion,
	insertJointEvaluationFile,
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setDeclarationComplianceState,
	setGipWorkforce,
	setUserPhone,
} from "./helpers/db";
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./helpers/dsfr";
import { indicatorGRequiredForGip } from "./helpers/indicator-g";
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

	// Regression #3939: a GIP-derived < 100 company without CSE must never see the
	// "déposer l'avis CSE" step — neither during the démarche nor after completion (where
	// the panel used to stay stuck on "avis CSE en cours" with a /avis-cse CTA). The
	// indicator-G path step follows the same GIP workforce (79 here), not the WEEZ headcount
	// or the has_cse flag, so it is hidden except on the tier's own indicator G years.
	test.describe("GIP < 100 without CSE: the CSE step is hidden, the indicator-G step follows the obligation", () => {
		const STEP2_TITLE =
			"Parcours de mise en conformité pour l'indicateur par catégorie de salariés";
		const STEP3_TITLE = "Déposer le ou les avis du CSE";
		const indicatorGRequired = indicatorGRequiredForGip(79);

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
				await setGipWorkforce(79);
				await setCompanyHasCse(false);
				await setUserPhone(TEST_USER_PHONE);
				await resetDeclarationToDraft();
			});

			test("announces the declaration step, and the indicator-G step only when owed", async ({
				page,
			}) => {
				await openPanel(page);
				const panel = page.locator(`#${PANEL_ID}`);

				await expect(
					panel.getByText("Déclaration des indicateurs de rémunération"),
				).toBeVisible();
				if (indicatorGRequired) {
					await expect(panel.getByText(STEP2_TITLE)).toBeVisible();
				} else {
					await expect(panel.getByText(STEP2_TITLE)).toHaveCount(0);
				}
				await expect(panel.getByText(STEP3_TITLE)).toHaveCount(0);
			});
		});

		test.describe("after completion (démarche_completed, not subject)", () => {
			test.beforeAll(async () => {
				await ensureCurrentYearDeclaration();
				await setGipWorkforce(79);
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

	// #3939 follow-up: a GIP-derived >= 100 company that declared "sans CSE" is still
	// subject to indicator G, so the panel keeps the indicator-G path step (step 2),
	// but must never ask it to deposit a CSE opinion — step 3 and the "avis CSE
	// modifiables" closing note are hidden, during the démarche and after completion.
	// Step visibility is driven by isCseOpinionRequired({ workforce, hasCse }), not the
	// workforce alone, so this differs from the < 100 case where step 2 is hidden too.
	test.describe("GIP >= 100 without CSE: indicator-G step shown, CSE step hidden", () => {
		const STEP2_TITLE =
			"Parcours de mise en conformité pour l'indicateur par catégorie de salariés";
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

	test.describe("declaration submitted, démarche still running", () => {
		test.beforeAll(async () => {
			await setDeclarationComplianceState({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
			});
		});

		test("both recaps sit next to the prefill file, and each endpoint serves a PDF", async ({
			page,
		}) => {
			const panel = await openDocumentsPanel(page);

			await expect(documentsTrigger(page)).toHaveText("Documents (3)");

			const indicatorsHref = `/api/declaration-pdf?year=${CURRENT_YEAR}`;
			const transmittedHref = `/api/transmitted-pdf?year=${CURRENT_YEAR}`;

			await expect(
				panel.getByRole("link", { name: PREFILL_TITLE }),
			).toBeVisible();
			await expect(
				panel.getByRole("link", { name: RECAP_INDICATORS_TITLE }),
			).toHaveAttribute("href", indicatorsHref);
			await expect(
				panel.getByRole("link", { name: RECAP_TRANSMITTED_TITLE }),
			).toHaveAttribute("href", transmittedHref);

			for (const href of [indicatorsHref, transmittedHref]) {
				const response = await page.request.get(href, { timeout: 30_000 });
				expect(response.status(), `GET ${href}`).toBe(200);
				expect(response.headers()["content-type"]).toContain("pdf");
			}
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

// #3662 — three layout contracts of the side panel, none of which a unit test can
// hold: the rhythm below only exists once `space-between` has no free space left
// to distribute, the link underline is a `background-size: 100% 1px` gradient
// painted across the button box, and the step connector is a `::before`. jsdom
// resolves no geometry at all, so asserting the class names would only restate
// the fix. Measured here in a real browser instead.
const RHYTHM_FLOOR = 32; // .panelContent's 2rem gap
const GREY_CONNECTOR = "rgb(221, 221, 221)"; // --border-default-grey
const GREEN_CONNECTOR = "rgb(24, 117, 60)"; // --background-flat-success

test.describe("Declaration process panel — layout", () => {
	test.describe.configure({ mode: "serial" });
	test.setTimeout(90_000);

	test.beforeAll(async () => {
		await ensureCurrentYearDeclaration();
		await resetGipWorkforce();
		await setCompanyHasCse(true);
		await setUserPhone(TEST_USER_PHONE);
		// compliance_choice is the one variant whose stepper carries a step *in
		// progress* that is still followed by another one — without that, the
		// connector these assertions are about would not be drawn at all.
		await setDeclarationComplianceState({
			status: "awaiting_compliance_path_choice",
		});
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
	});

	test("keeps its rhythm, its link widths and its connector colours", async ({
		page,
	}) => {
		// Deliberately short: with spare vertical room `space-between` spreads the
		// two blocks apart on its own and the `gap` is never exercised, so the
		// collapse this pins can only be reproduced on a panel the content fills.
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/mon-espace");
		await waitForDsfrModal(page, PANEL_ID);
		const remuButton = page.getByRole("button", { name: "Rémunération" });
		await expect(remuButton.first()).toBeVisible();
		await clickAndExpectDialogOpen(page, remuButton.first(), PANEL_ID);

		const panel = page.locator(`#${PANEL_ID}`);

		await test.step("the help block stays 2rem below the content", async () => {
			const measured = await panel
				.getByText("Pour vous aider")
				.evaluate((heading) => {
					const helpBlock = heading.parentElement?.parentElement;
					const contentBlock = helpBlock?.previousElementSibling;
					const scroller = helpBlock?.parentElement;
					if (!helpBlock || !contentBlock || !scroller) {
						throw new Error(
							"the panel must stack a content block above a help block",
						);
					}
					return {
						overflowing: scroller.scrollHeight > scroller.clientHeight,
						gap: Math.round(
							helpBlock.getBoundingClientRect().top -
								contentBlock.getBoundingClientRect().bottom,
						),
					};
				});

			// Guard, not decoration: on a panel with room to spare the gap below
			// would clear 32px even with the bug in place, and this contract would
			// pass without ever touching what it claims to cover.
			expect(
				measured.overflowing,
				"the seeded panel must overflow for this contract to bite",
			).toBe(true);
			expect(measured.gap).toBeGreaterThanOrEqual(RHYTHM_FLOOR);
		});

		await test.step("each help link is only as wide as its own text", async () => {
			for (const label of ["Détail des étapes", "Centre d'aide"]) {
				const measured = await panel
					.getByRole("button", { name: label })
					.evaluate((button) => {
						const column = button.parentElement;
						if (!column) {
							throw new Error("the link must sit in the help links column");
						}
						const range = document.createRange();
						range.selectNodeContents(button);
						return {
							box: button.getBoundingClientRect().width,
							text: range.getBoundingClientRect().width,
							column: column.getBoundingClientRect().width,
						};
					});

				// The underline spans the button box, so the box width *is* the
				// underline width — that is the whole symptom.
				expect(
					Math.abs(measured.box - measured.text),
					`"${label}" underline overshoot`,
				).toBeLessThanOrEqual(1);
				// And the column really was wider, so stretching was on the table.
				expect(measured.box, `"${label}" vs its column`).toBeLessThan(
					measured.column,
				);
			}
		});

		await test.step("no step connector is blue", async () => {
			const rows = await panel.evaluate((element) => {
				const STATUSES = ["Étape terminée", "Étape en cours", "Étape à venir"];
				return Array.from(element.querySelectorAll(".fr-sr-only"))
					.filter((label) => STATUSES.includes(label.textContent?.trim() ?? ""))
					.map((label) => {
						const row = label.parentElement?.parentElement;
						if (!row?.parentElement) {
							throw new Error("a step circle must sit inside a step row");
						}
						return {
							status: label.textContent?.trim() ?? "",
							// The connector is drawn by a `:not(:last-child)::before`.
							hasConnector: row !== row.parentElement.lastElementChild,
							colour: getComputedStyle(row, "::before").backgroundColor,
						};
					});
			});

			const current = rows.find((row) => row.status === "Étape en cours");
			expect(
				current?.hasConnector,
				"the step in progress must own the connector under test",
			).toBe(true);
			expect(current?.colour, "the connector of the step in progress").toBe(
				GREY_CONNECTOR,
			);

			for (const row of rows.filter((candidate) => candidate.hasConnector)) {
				expect(
					[GREY_CONNECTOR, GREEN_CONNECTOR],
					`connector of "${row.status}"`,
				).toContain(row.colour);
			}
		});
	});
});
