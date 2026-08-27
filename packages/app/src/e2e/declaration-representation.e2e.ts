import { expect, type Page, test } from "@playwright/test";

import {
	getReferenceYearFor,
	getRepresentationTarget,
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
} from "~/modules/domain";

import { TEST_SIREN } from "./constants";
import {
	getCurrentDbYear,
	resetGipWorkforce,
	resetRepresentationDeclaration,
	setGipWorkforce,
	setRepresentationWorkforceWindow,
} from "./helpers/db";
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./helpers/dsfr";

/**
 * Balanced representation (« représentation équilibrée », loi Rixain) — the
 * whole journey introduced by epic #3702, from the Mon espace entry point to
 * the machine APIs that republish the submitted declaration.
 *
 * Component rendering is covered by declaration-representation/**\/__tests__;
 * what only a running server can prove is the chain this spec walks: the GIP
 * pre-filter that decides whether the démarche exists at all, the server-side
 * step guards, the debounced draft persisted across five real navigations, the
 * submit mutation, and the three read surfaces (PDF, public API, SUIT export)
 * that read back what the funnel wrote.
 *
 * The last describe walks the second outcome of that same démarche (epic #4324):
 * a company below the 1 000-employee threshold answers once and is done — the
 * non-subjection is a declaration result, persisted and restituted, not a dead
 * end in the UI.
 */

const PANEL_ID = "representation-process-panel";
const SUBMIT_MODAL_ID = "representation-submit-modal";
const FUNNEL_ROOT = "/declaration-representation";

// Dev gateway shared secret — the deterministic local value from `.env.example`,
// injected in prod by the APISIX `proxy-rewrite` plugin. Not a secret.
const DEV_GATEWAY_SHARED_SECRET = "dev-gateway-shared-secret-minimum-32-chars";

const EXECUTIVE_WOMEN_PERCENT = 30;
const MEMBER_WOMEN_PERCENT = 20;
const PUBLISH_URL = "https://example.fr/representation-equilibree";

function dayString(offsetDays: number): string {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() + offsetDays);
	return date.toISOString().slice(0, 10);
}

/** The `Étape n sur 5` state lives inside the stepper heading, which is the only
 * discriminating landmark: the h1 is identical on all five steps. */
async function expectOnStep(page: Page, step: number, title: string) {
	await page.waitForURL(`**${FUNNEL_ROOT}/etape/${step}`);
	await expect(
		page.getByRole("heading", {
			name: new RegExp(`${title}.*Étape ${step} sur 5`, "s"),
		}),
	).toBeVisible();
}

async function goNext(page: Page) {
	await page.getByRole("button", { name: "Suivant" }).click();
}

/** DSFR draws a radio through its `<label>`, which covers the transparent input:
 * the hit-target check can never pass, so the click is forced and the resulting
 * state asserted instead. */
async function chooseRadio(page: Page, name: RegExp | string) {
	const radio = page.getByRole("radio", {
		name,
		exact: typeof name === "string",
	});
	await radio.check({ force: true });
	await expect(radio).toBeChecked();
}

test.describe("Représentation équilibrée — parcours déclaratif complet", () => {
	test.describe.configure({ mode: "serial" });

	let campaignYear: number;
	let referenceYear: number;
	let seededYears: number[] = [];

	test.beforeAll(async () => {
		campaignYear = await getCurrentDbYear();
		referenceYear = getReferenceYearFor(campaignYear);
		await resetRepresentationDeclaration();
		seededYears = await setRepresentationWorkforceWindow(
			campaignYear,
			REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
		);
	});

	test.afterAll(async () => {
		await resetRepresentationDeclaration();
		// Restore the suite baseline: only the calendar year carries a GIP row, at
		// TEST_GIP_WORKFORCE. Leaving the extra exercises behind would flip
		// `hasPrefillData` for years the remuneration specs assert on.
		for (const year of seededYears) {
			await setGipWorkforce(null, year);
		}
		await resetGipWorkforce();
	});

	test("the démarche stays hidden while one of the three exercises is below the workforce threshold", async ({
		page,
	}) => {
		await setGipWorkforce(
			REPRESENTATION_SUBJECTION_WORKFORCE_MIN - 1,
			campaignYear - 1,
		);
		await page.goto("/mon-espace");
		await expect(
			page.getByRole("button", { name: "Rémunération", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Représentation", exact: true }),
		).toHaveCount(0);

		await setGipWorkforce(
			REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
			campaignYear - 1,
		);
		await page.goto("/mon-espace");
		await expect(
			page.getByRole("button", { name: "Représentation", exact: true }),
		).toBeVisible();
	});

	test("the Mon espace row opens the démarche panel and offers to start", async ({
		page,
	}) => {
		await page.goto("/mon-espace");
		await waitForDsfrModal(page, PANEL_ID);

		const row = page.getByRole("row", { name: /Représentation/ });
		await expect(row).toContainText("Vérification de l'assujettissement");

		await clickAndExpectDialogOpen(
			page,
			page.getByRole("button", { name: "Représentation", exact: true }),
			PANEL_ID,
		);

		const panel = page.locator(`#${PANEL_ID}`);
		await expect(
			panel.getByRole("heading", {
				name: `Démarche des indicateurs de représentation ${campaignYear}`,
			}),
		).toBeVisible();
		await expect(
			panel.getByRole("link", { name: "Commencer" }),
		).toHaveAttribute("href", FUNNEL_ROOT);
	});

	test("a declarant walks the five steps, submits, and lands on the confirmation", async ({
		page,
	}) => {
		test.slow(); // Subjection screen + five real navigations + submission.

		await test.step("subjection screen gates on the 1 000-employee answer", async () => {
			await page.goto(FUNNEL_ROOT);
			await expect(
				page.getByRole("heading", {
					name: "L'entreprise est-elle concernée ?",
				}),
			).toBeVisible();

			// Submitting without an answer must not navigate.
			await page.getByRole("button", { name: "Suivant" }).click();
			await expect(
				page.getByText("Veuillez sélectionner une option pour continuer."),
			).toBeVisible();
			await expect(page).toHaveURL(new RegExp(`${FUNNEL_ROOT}$`));

			await chooseRadio(page, /1 000 salariés ou plus/);
			await goNext(page);
		});

		await test.step("step 1 — reference period", async () => {
			await expectOnStep(page, 1, "Période de référence");

			// The two dates are linked (12 consecutive months): filling one derives
			// the other. An end date outside the reference year is still refused
			// client-side: the guard runs before saveDraft, so a rejected step
			// never advances the URL.
			await page
				.locator("#reference-period-end")
				.fill(`${referenceYear - 1}-12-31`);
			await goNext(page);
			await expect(
				page.getByText(
					/La date sélectionnée ne correspond pas à l'année de référence/,
				),
			).toBeVisible();

			await page
				.locator("#reference-period-start")
				.fill(`${referenceYear}-01-01`);
			await goNext(page);
		});

		await test.step("step 2 — executives, computable and compliant", async () => {
			await expectOnStep(
				page,
				2,
				"Écarts de représentation - Cadres dirigeants",
			);

			await chooseRadio(page, /Deux cadres dirigeants ou plus/);
			await page
				.getByRole("textbox", { name: /^Femmes/ })
				.fill(String(EXECUTIVE_WOMEN_PERCENT));

			// The pair auto-completes: typing women fills men with the complement.
			await expect(page.getByRole("textbox", { name: /^Hommes/ })).toHaveValue(
				String(100 - EXECUTIVE_WOMEN_PERCENT),
			);
			await expect(page.getByText("Conforme", { exact: true })).toBeVisible();
			await expect(
				page.getByText(
					`Objectif de ${getRepresentationTarget(campaignYear)} % atteint`,
				),
			).toBeVisible();

			await goNext(page);
		});

		await test.step("step 3 — management bodies, computable and non compliant", async () => {
			await expectOnStep(
				page,
				3,
				"Écarts de représentation - Instances dirigeantes",
			);

			await chooseRadio(page, /Au moins une instance dirigeante/);
			await page
				.getByRole("textbox", { name: /^Femmes/ })
				.fill(String(MEMBER_WOMEN_PERCENT));
			await expect(page.getByRole("textbox", { name: /^Hommes/ })).toHaveValue(
				String(100 - MEMBER_WOMEN_PERCENT),
			);
			await expect(
				page.getByText("Non conforme", { exact: true }),
			).toBeVisible();

			await goNext(page);
		});

		await test.step("step 4 — publication details", async () => {
			await expectOnStep(page, 4, "Informations de publication");

			// A publication date inside the reference period is refused.
			await page
				.getByLabel(/Date de publication des écarts calculables/)
				.fill(`${referenceYear}-06-30`);
			await chooseRadio(page, "Oui");
			await page
				.getByLabel(/Indiquez l'adresse de la page Internet/)
				.fill(PUBLISH_URL);
			await goNext(page);
			await expect(
				page.getByText(
					"La date de publication doit être postérieure à la fin de la période de référence.",
				),
			).toBeVisible();

			await page
				.getByLabel(/Date de publication des écarts calculables/)
				.fill(`${campaignYear}-02-15`);
			await goNext(page);
		});

		await test.step("step 5 — the recap restitutes what was declared", async () => {
			await expectOnStep(page, 5, "Récapitulatif");

			await expect(
				page.getByText(`01/01/${referenceYear} - 31/12/${referenceYear}`),
			).toBeVisible();
			await expect(
				page.getByText(`${EXECUTIVE_WOMEN_PERCENT} %`, { exact: true }),
			).toBeVisible();
			await expect(
				page.getByText(`${100 - MEMBER_WOMEN_PERCENT} %`, { exact: true }),
			).toBeVisible();
			await expect(page.getByText(PUBLISH_URL)).toBeVisible();

			// One indicator is non compliant, so the corrective-measures block shows.
			await expect(
				page.getByRole("heading", { name: "Prochaines étapes" }),
			).toBeVisible();
			await expect(
				page.getByRole("link", { name: /TéléAccords/ }),
			).toBeVisible();
		});

		await test.step("submission requires the certification checkbox", async () => {
			await waitForDsfrModal(page, SUBMIT_MODAL_ID);
			await clickAndExpectDialogOpen(
				page,
				page.getByRole("button", { name: "Soumettre" }),
				SUBMIT_MODAL_ID,
			);

			const modal = page.locator(`#${SUBMIT_MODAL_ID}`);
			const validate = modal.getByRole("button", { name: "Valider" });
			await expect(validate).toBeDisabled();

			const certify = modal.locator("#representation-submit-certify");
			await certify.check({ force: true });
			await expect(certify).toBeChecked();
			await expect(validate).toBeEnabled();
			await validate.click();
		});

		await test.step("confirmation screen", async () => {
			await page.waitForURL(`**${FUNNEL_ROOT}/confirmation`);
			await expect(
				page.getByText(`Votre parcours ${campaignYear} est désormais terminé`),
			).toBeVisible();
			await expect(
				page.getByRole("link", {
					name: /Télécharger le récapitulatif de la déclaration/,
				}),
			).toHaveAttribute(
				"href",
				`/api/representation-pdf?year=${referenceYear}`,
			);
		});
	});

	test("the submitted declaration is served as a PDF récapitulatif", async ({
		page,
	}) => {
		const response = await page.request.get(
			`/api/representation-pdf?year=${referenceYear}`,
		);
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toContain("application/pdf");
	});

	test("the public API republishes the raw declared gaps and no verdict", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.get(
				`/api/public/representations/${TEST_SIREN}/${referenceYear}`,
			);
			expect(response.status()).toBe(200);

			const body = await response.json();
			expect(body.siren).toBe(TEST_SIREN);
			expect(body.year).toBe(referenceYear);
			expect(body.executiveWomenPercent).toBe(EXECUTIVE_WOMEN_PERCENT);
			expect(body.memberMenPercent).toBe(100 - MEMBER_WOMEN_PERCENT);
			expect(body.publishUrl).toBe(PUBLISH_URL);
			expect(body.referencePeriodStart).toBe(`${referenceYear}-01-01`);

			// V2 product rule: the public API diffuses raw declared data only — never
			// a compliance verdict nor a score, whatever the gaps say.
			for (const key of Object.keys(body)) {
				expect(key).not.toMatch(/verdict|score|conformit|compliance/i);
			}
		} finally {
			await anonCtx.close();
		}
	});

	test("the SUIT export exposes the declaration through the gateway contract", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.get(
				`/api/v1/export/representations?date_begin=${dayString(-1)}&date_end=${dayString(1)}`,
				{ headers: { "X-Gateway-Forwarded": DEV_GATEWAY_SHARED_SECRET } },
			);
			expect(response.status()).toBe(200);

			const body = await response.json();
			const declaration = body.Representations.find(
				(row: { SIREN: string }) => row.SIREN === TEST_SIREN,
			);
			expect(declaration).toBeDefined();
			expect(declaration.Année_référence).toBe(referenceYear);
			expect(declaration.Pourcentage_femmes_cadres).toBe(
				EXECUTIVE_WOMEN_PERCENT,
			);
			expect(declaration.Pourcentage_hommes_membres).toBe(
				100 - MEMBER_WOMEN_PERCENT,
			);
			expect(declaration.URL_publication).toBe(PUBLISH_URL);
		} finally {
			await anonCtx.close();
		}
	});

	test("Mon espace reflects the transmitted declaration", async ({ page }) => {
		await page.goto("/mon-espace");
		await waitForDsfrModal(page, PANEL_ID);

		await expect(
			page.getByRole("row", { name: /Représentation/ }),
		).toContainText(
			"Finalisation - Démarche des indicateurs de représentation",
		);

		await clickAndExpectDialogOpen(
			page,
			page.getByRole("button", { name: "Représentation", exact: true }),
			PANEL_ID,
		);
		await expect(
			page
				.locator(`#${PANEL_ID}`)
				.getByRole("link", { name: "Voir la déclaration" }),
		).toHaveAttribute("href", `${FUNNEL_ROOT}/etape/5`);
	});
});

test.describe("Représentation équilibrée — écarts non calculables", () => {
	test.describe.configure({ mode: "serial" });

	let campaignYear: number;
	let referenceYear: number;
	let seededYears: number[] = [];

	test.beforeAll(async () => {
		campaignYear = await getCurrentDbYear();
		referenceYear = getReferenceYearFor(campaignYear);
		await resetRepresentationDeclaration();
		seededYears = await setRepresentationWorkforceWindow(
			campaignYear,
			REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
		);
	});

	test.afterAll(async () => {
		await resetRepresentationDeclaration();
		for (const year of seededYears) {
			await setGipWorkforce(null, year);
		}
		await resetGipWorkforce();
	});

	test("with no executive and no management body, the publication step is skipped", async ({
		page,
	}) => {
		test.slow();

		await page.goto(FUNNEL_ROOT);
		await chooseRadio(page, /1 000 salariés ou plus/);
		await goNext(page);

		await expectOnStep(page, 1, "Période de référence");
		await page
			.locator("#reference-period-start")
			.fill(`${referenceYear}-01-01`);
		await page.locator("#reference-period-end").fill(`${referenceYear}-12-31`);
		await goNext(page);

		await expectOnStep(page, 2, "Écarts de représentation - Cadres dirigeants");
		await chooseRadio(page, /Aucun cadre dirigeant/);
		await goNext(page);

		await expectOnStep(
			page,
			3,
			"Écarts de représentation - Instances dirigeantes",
		);
		await chooseRadio(page, /Aucune instance dirigeante/);
		await goNext(page);

		// Nothing is publishable, so step 4 is skipped in both directions.
		await expectOnStep(page, 5, "Récapitulatif");
		await expect(page.getByRole("link", { name: "Précédent" })).toHaveAttribute(
			"href",
			`${FUNNEL_ROOT}/etape/3`,
		);
		await expect(page.getByText("Aucun cadre dirigeant")).toBeVisible();
		await expect(page.getByText("Aucune instance dirigeante")).toBeVisible();
		await expect(page.getByText("Non applicable").first()).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Publication" }),
		).toHaveCount(0);
		await expect(
			page.getByRole("heading", { name: "Prochaines étapes" }),
		).toHaveCount(0);

		await page.goto(`${FUNNEL_ROOT}/etape/4`);
		await page.waitForURL(`**${FUNNEL_ROOT}/etape/5`);
	});

	test("a step beyond the reached one redirects back to the reachable step", async ({
		page,
	}) => {
		await resetRepresentationDeclaration();

		await page.goto(`${FUNNEL_ROOT}/etape/3`);
		await page.waitForURL(`**${FUNNEL_ROOT}/etape/1`);
		await expectOnStep(page, 1, "Période de référence");
	});
});

test.describe("Représentation équilibrée — parcours non-assujetti", () => {
	test.describe.configure({ mode: "serial" });

	let campaignYear: number;
	let referenceYear: number;
	let seededYears: number[] = [];

	test.beforeAll(async () => {
		campaignYear = await getCurrentDbYear();
		referenceYear = getReferenceYearFor(campaignYear);
		await resetRepresentationDeclaration();
		seededYears = await setRepresentationWorkforceWindow(
			campaignYear,
			REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
		);
	});

	test.afterAll(async () => {
		await resetRepresentationDeclaration();
		for (const year of seededYears) {
			await setGipWorkforce(null, year);
		}
		await resetGipWorkforce();
	});

	test("answering « moins de 1 000 salariés » closes the démarche without a funnel", async ({
		page,
	}) => {
		await page.goto(FUNNEL_ROOT);
		await chooseRadio(page, /Moins de 1 000 salariés/);
		await expect(
			page.getByText(/Vous n'êtes pas assujetti à la publication/),
		).toBeVisible();

		await page.getByRole("button", { name: "Valider" }).click();
		await page.waitForURL("**/mon-espace");
	});

	test("Mon espace records the non-subjection as a result, with no deadline and no récapitulatif", async ({
		page,
	}) => {
		await page.goto("/mon-espace");

		const row = page.getByRole("row", { name: /Représentation/ });
		await expect(row).toContainText("Non-assujetti");
		await expect(row).toContainText("Effectué");
		// A démarche that does not apply carries neither a deadline nor a receipt.
		await expect(
			row.getByRole("cell", { name: "-", exact: true }),
		).toBeVisible();
		await expect(
			row.getByRole("cell", { name: "Aucune", exact: true }),
		).toBeVisible();

		const pdf = await page.request.get(
			`/api/representation-pdf?year=${referenceYear}`,
		);
		expect(pdf.status()).toBe(404);
	});

	test("the panel keeps the subjection step alone and offers to reopen the démarche", async ({
		page,
	}) => {
		await page.goto("/mon-espace");
		await waitForDsfrModal(page, PANEL_ID);
		await clickAndExpectDialogOpen(
			page,
			page.getByRole("button", { name: "Représentation", exact: true }),
			PANEL_ID,
		);

		const panel = page.locator(`#${PANEL_ID}`);
		await expect(
			panel.getByText(/Vous n'êtes pas assujetti à la publication/),
		).toBeVisible();
		await expect(
			panel.getByText("Vérification de l'assujettissement"),
		).toBeVisible();

		// Neither the declaration step nor the Rixain reminder applies below the threshold.
		await expect(panel.getByText(/Écarts de représentation/)).toHaveCount(0);
		await expect(panel.getByText(/loi Rixain/)).toHaveCount(0);

		await expect(panel.getByRole("link", { name: "Modifier" })).toHaveAttribute(
			"href",
			FUNNEL_ROOT,
		);
	});

	test("the answer is reversible: pre-filled on return, and starting the funnel drops the status", async ({
		page,
	}) => {
		await page.goto(FUNNEL_ROOT);
		await expect(
			page.getByRole("radio", { name: /Moins de 1 000 salariés/ }),
		).toBeChecked();

		await chooseRadio(page, /1 000 salariés ou plus/);
		await goNext(page);

		await expectOnStep(page, 1, "Période de référence");
		await page
			.locator("#reference-period-start")
			.fill(`${referenceYear}-01-01`);
		await page.locator("#reference-period-end").fill(`${referenceYear}-12-31`);
		await goNext(page);
		await expectOnStep(page, 2, "Écarts de représentation - Cadres dirigeants");

		await page.goto("/mon-espace");
		const row = page.getByRole("row", { name: /Représentation/ });
		await expect(row).toContainText(
			"Écarts de représentation - Cadres dirigeants",
		);
		await expect(row).toContainText("En cours");
		await expect(row).not.toContainText("Non-assujetti");
	});
});
