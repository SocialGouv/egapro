import { expect, type Page, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import { representationPdfFilename } from "~/modules/declarationPdf/representationPdfFilename";
import {
	formatCivilLongDate,
	formatPercentage,
	formatPrecisePercentage,
	getCurrentRepresentationCampaignYear,
	getReferenceYearFor,
	getRepresentationCampaignEndDate,
	getRepresentationTarget,
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
} from "~/modules/domain";
import {
	API_PUBLIC_DECLARATIONS_EXPORT,
	DECLARATION_REPRESENTATION,
	FIRST_REPRESENTATION_STEP,
	MY_SPACE,
	mySpaceRepresentationHref,
	OBSERVATORY_SEARCH,
	observatoryCompanyHref,
	representationStepHref,
	routeWithQuery,
} from "~/modules/routes";
// Leaf module, not the barrel: the Playwright runner cannot load the CSS
// modules the barrel pulls in through its React components.
import { SUBMIT_LABEL } from "~/modules/shared/submitLabels";
import { TEST_SIREN } from "./constants";
import {
	getTestCompanyName,
	resetGipWorkforce,
	resetRepresentationDeclaration,
	setGipWorkforce,
	setRepresentationWorkforceWindow,
} from "./helpers/db";
import {
	dbDateInDays,
	deleteCampaignDeadlines,
	getCampaignPublicRelease,
	setPublicDataReleaseDate,
} from "./helpers/db-campaign";
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./helpers/dsfr";
import { fetchAttachment, waitForEmail } from "./helpers/mailpit";
import {
	clearNotificationQueue,
	killWorker,
	spawnNotificationsWorker,
	waitForWorkerReady,
} from "./helpers/notifications-worker";
import { mailChainAvailable } from "./helpers/receipts";
import { getTestUserEmail } from "./helpers/testUser";

/**
 * Balanced representation (« représentation équilibrée », loi Rixain) — the
 * whole journey introduced by epic #3702, from the Mon espace entry point to
 * the public and machine surfaces that republish the submitted declaration.
 *
 * Component rendering is covered by declaration-representation/**\/__tests__;
 * what only a running server can prove is the chain this spec walks: the GIP
 * pre-filter that decides whether the démarche exists at all, the server-side
 * step guards, the debounced draft persisted across five real navigations, the
 * submit mutation, and the three read surfaces (PDF, public company page, SUIT export)
 * that read back what the funnel wrote.
 *
 * The last describe walks the second outcome of that same démarche (epic #4324):
 * a company below the 1 000-employee threshold answers once and is done — the
 * non-subjection is a declaration result, persisted and restituted, not a dead
 * end in the UI.
 */

const PANEL_ID = "representation-process-panel";
const SUBMIT_MODAL_ID = "representation-submit-modal";
const FUNNEL_ROOT = DECLARATION_REPRESENTATION;

// Dev gateway shared secret — the deterministic local value from `.env.example`,
// injected in prod by the APISIX `proxy-rewrite` plugin. Not a secret.
const DEV_GATEWAY_SHARED_SECRET = "dev-gateway-shared-secret-minimum-32-chars";

const EXECUTIVE_WOMEN_PERCENT = 30;
const MEMBER_WOMEN_PERCENT = 20;
const PUBLISH_URL = "https://example.fr/representation-equilibree";
const RECEIPT_SUBJECT =
	"Egapro - Transmission de la déclaration de la représentation équilibrée";

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

async function openRepresentationTab(page: Page) {
	const tab = page.getByRole("tab", { name: "Représentation", exact: true });
	await expect(async () => {
		await tab.click();
		await expect(tab).toHaveAttribute("aria-selected", "true", {
			timeout: 1_000,
		});
	}).toPass();
	return page.getByRole("tabpanel", { name: "Représentation" });
}

async function goNext(page: Page) {
	await page.getByRole("button", { name: "Suivant" }).click();
}

/** DSFR draws a radio through its `<label>`, which covers the transparent input:
 * the hit-target check can never pass, so the click is forced and the resulting
 * state asserted instead. A forced click skips the enabled check too, and the
 * funnel stays read-only until the declaration lock is acquired. */
async function chooseRadio(page: Page, name: RegExp | string) {
	const radio = page.getByRole("radio", {
		name,
		exact: typeof name === "string",
	});
	await expect(radio).toBeEnabled();
	await radio.check({ force: true });
	await expect(radio).toBeChecked();
}

test.describe("Représentation équilibrée — parcours déclaratif complet", () => {
	test.describe.configure({ mode: "serial" });

	let campaignYear: number;
	let referenceYear: number;
	let seededYears: number[] = [];
	let submittedAt: Date;

	test.beforeAll(async () => {
		campaignYear = getCurrentRepresentationCampaignYear();
		referenceYear = getReferenceYearFor(campaignYear);
		await resetRepresentationDeclaration();
		await clearNotificationQueue();
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
		await page.goto(MY_SPACE);
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
		await page.goto(MY_SPACE);
		await expect(
			page.getByRole("button", { name: "Représentation", exact: true }),
		).toBeVisible();
	});

	test("the Mon espace row opens the démarche panel and offers to start", async ({
		page,
	}) => {
		await page.goto(MY_SPACE);
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
			await expect(
				page.getByText(
					`Objectif de ${getRepresentationTarget(campaignYear)} % non atteint`,
				),
			).toBeVisible();

			await goNext(page);
		});

		await test.step("resuming lands on the step last edited, the furthest one stays reachable (#4998)", async () => {
			await expectOnStep(page, 4, "Informations de publication");
			await page.goto(`${FUNNEL_ROOT}/etape/2`);
			await expectOnStep(
				page,
				2,
				"Écarts de représentation - Cadres dirigeants",
			);

			const draftSaved = page.waitForResponse(
				(response) =>
					response.url().includes("representationDeclaration.saveDraft") &&
					response.ok(),
			);
			const womenField = page.getByRole("textbox", { name: /^Femmes/ });
			await womenField.fill(String(100 - EXECUTIVE_WOMEN_PERCENT));
			await womenField.fill(String(EXECUTIVE_WOMEN_PERCENT));
			await draftSaved;

			await page.goto(FUNNEL_ROOT);
			await expectOnStep(
				page,
				2,
				"Écarts de représentation - Cadres dirigeants",
			);

			await page.goto(`${FUNNEL_ROOT}/etape/4`);
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
				page.getByRole("button", { exact: true, name: SUBMIT_LABEL }),
				SUBMIT_MODAL_ID,
			);

			const modal = page.locator(`#${SUBMIT_MODAL_ID}`);
			const validate = modal.getByRole("button", { name: "Valider" });
			await expect(validate).toBeDisabled();

			const certify = modal.locator("#representation-submit-certify");
			await certify.check({ force: true });
			await expect(certify).toBeChecked();
			await expect(validate).toBeEnabled();
			submittedAt = new Date();
			await validate.click();
		});

		await test.step("confirmation screen", async () => {
			await page.waitForURL(`**${FUNNEL_ROOT}/confirmation`);
			const companyName = await getTestCompanyName();
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
			await expect(
				page.getByRole("heading", { name: "Publication des résultats" }),
			).toBeVisible();
			await expect(
				page.getByText(
					`Les résultats déclarés par ${companyName} seront rendus publics dans l'onglet « Observatoire » d'Egapro.`,
				),
			).toBeVisible();
			await expect(page.getByText(/à l'exception de l'indicateur/)).toHaveCount(
				0,
			);
			await expect(
				page.getByRole("link", { name: "Consulter l'observatoire" }),
			).toHaveAttribute("href", OBSERVATORY_SEARCH);
			await expect(
				page.getByText("Comment s'est passée votre démarche ?"),
			).toBeVisible();
			await expect(
				page.getByRole("link", { name: /Je donne mon avis/ }),
			).toBeVisible();
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

	test("the receipt email carries the PDF récapitulatif as an attachment", async () => {
		test.skip(
			!(await mailChainAvailable()),
			"MAIL_ENABLED off or Mailpit unreachable — no receipt can arrive",
		);
		// The worker only runs inside mail specs: the job enqueued at submission waits for it.
		const worker = spawnNotificationsWorker();
		try {
			await waitForWorkerReady(worker);
			const email = await waitForEmail(
				getTestUserEmail(),
				(m) => m.subject === RECEIPT_SUBJECT,
				{ since: submittedAt },
			);

			// A failed PDF render is swallowed so the receipt still leaves: only the attachment list shows it.
			expect(email.attachments.map((a) => a.fileName)).toEqual([
				representationPdfFilename(TEST_SIREN, campaignYear),
			]);
			const [attachment] = email.attachments;
			expect(attachment?.contentType).toBe("application/pdf");
			const content = await fetchAttachment(email.id, attachment?.partId ?? "");
			expect(content.subarray(0, 5).toString("latin1")).toBe("%PDF-");
		} finally {
			await killWorker(worker);
		}
	});

	test("the public company page shows the declaration only once its campaign is publicly released", async ({
		browser,
	}) => {
		const releaseYear = referenceYear + 1;
		const baseline = await getCampaignPublicRelease(releaseYear);
		const companyUrl = routeWithQuery(
			observatoryCompanyHref(TEST_SIREN),
			new URLSearchParams({ year: String(referenceYear) }),
		);
		const anonCtx = await browser.newContext({ storageState: undefined });
		const anonPage = await anonCtx.newPage();

		async function expectRepresentationNotPublished() {
			await anonPage.goto(companyUrl);
			const unavailable = anonPage.getByRole("heading", {
				level: 1,
				name: "Résultats indisponibles",
			});
			await expect(
				unavailable.or(
					anonPage.getByRole("tab", { name: "Représentation", exact: true }),
				),
			).toBeVisible();
			if (await unavailable.isVisible()) return;
			const panel = await openRepresentationTab(anonPage);
			await expect(
				panel.getByRole("heading", {
					name: /Aucune déclaration de représentation équilibrée/,
				}),
			).toBeVisible();
			await expect(panel.locator("#representation-title")).toHaveCount(0);
		}

		try {
			await test.step("no release date — the transmitted declaration stays private", async () => {
				await setPublicDataReleaseDate(releaseYear, null);
				await expectRepresentationNotPublished();
			});

			await test.step("a release date still to come — same answer", async () => {
				await setPublicDataReleaseDate(releaseYear, await dbDateInDays(1));
				await expectRepresentationNotPublished();
			});

			await test.step("the release date reached — the raw declared gaps, and no verdict", async () => {
				await setPublicDataReleaseDate(releaseYear, await dbDateInDays(0));

				const response = await anonPage.goto(companyUrl);
				expect(response?.status()).toBe(200);
				const panel = await openRepresentationTab(anonPage);

				await expect(
					panel.getByRole("heading", { name: "Écarts de représentation" }),
				).toBeVisible();
				await expect(panel).toContainText(
					`Période de référence : 01/01/${referenceYear} - 31/12/${referenceYear}`,
				);
				await expect(panel).toContainText(
					`Femmes : ${formatPrecisePercentage(EXECUTIVE_WOMEN_PERCENT)}`,
				);
				await expect(panel).toContainText(
					`Hommes : ${formatPrecisePercentage(100 - MEMBER_WOMEN_PERCENT)}`,
				);
				await expect(panel.getByText(/conforme|objectif/i)).toHaveCount(0);
			});

			await test.step("no public API serves the representation, only the remuneration export remains", async () => {
				const retiredUrls = [
					"/api/public/declarations",
					`/api/public/declarations/${TEST_SIREN}`,
					`/api/public/declarations/${TEST_SIREN}/${campaignYear}`,
					"/api/public/representations",
					`/api/public/representations/${TEST_SIREN}`,
					`/api/public/representations/${TEST_SIREN}/${referenceYear}`,
					"/api/public/representations/export?format=csv",
					"/api/search?q=Demo",
				];
				for (const url of retiredUrls) {
					const response = await anonCtx.request.get(url, { maxRedirects: 0 });
					expect(response.status(), url).toBe(404);
				}

				const exportResponse = await anonCtx.request.get(
					routeWithQuery(API_PUBLIC_DECLARATIONS_EXPORT, "format=csv"),
				);
				expect(exportResponse.status()).toBe(200);
				expect(exportResponse.headers()["content-type"]).toContain("text/csv");
			});
		} finally {
			if (baseline.exists) {
				await setPublicDataReleaseDate(
					releaseYear,
					baseline.publicDataReleaseDate,
				);
			} else {
				await deleteCampaignDeadlines(releaseYear);
			}
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
		await page.goto(MY_SPACE);
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
		const panel = page.locator(`#${PANEL_ID}`);
		const consultationHref = mySpaceRepresentationHref(campaignYear);

		await test.step("the panel carries no footer CTA: the transmitted row holds both actions", async () => {
			await expect(
				panel.getByRole("link", { name: "Voir la déclaration" }),
			).toHaveCount(0);
		});

		await test.step("the declaration step announces the transmission instead of the work left to do", async () => {
			await expect(
				panel.getByText("Votre déclaration a été transmise"),
			).toBeVisible();

			for (const item of [
				"Cadres dirigeants",
				"Instances dirigeantes",
				"Informations de publication",
			]) {
				await expect(panel.getByText(item, { exact: true })).toHaveCount(0);
			}
			await expect(panel.getByText(/Échéance :/)).toHaveCount(0);
		});

		await test.step("a transmitted declaration stays modifiable until the end of the campaign", async () => {
			await expect(
				panel.getByRole("link", {
					name: "Voir le récapitulatif de la déclaration",
				}),
			).toHaveAttribute("href", consultationHref);
			await expect(
				panel.getByRole("link", { name: "Modifier" }),
			).toHaveAttribute(
				"href",
				representationStepHref(FIRST_REPRESENTATION_STEP),
			);
			await expect(
				panel.getByText(
					`Modifiable jusqu'au ${formatCivilLongDate(getRepresentationCampaignEndDate(campaignYear))}`,
				),
			).toBeVisible();
		});

		await test.step("the view button opens the read-only consultation page", async () => {
			await panel
				.getByRole("link", { name: "Voir le récapitulatif de la déclaration" })
				.click();
			await page.waitForURL(urlGlob(consultationHref));

			const main = page.getByRole("main");
			await expect(
				main.getByRole("heading", {
					level: 1,
					name: `Démarche des indicateurs de représentation ${campaignYear}`,
				}),
			).toBeVisible();
			await expect(
				main.getByText(
					/^La déclaration a été transmise le \d{2}\/\d{2}\/\d{4}\.$/,
				),
			).toBeVisible();

			for (const section of [
				"Informations",
				"Écarts de représentation",
				"Publication",
			]) {
				await expect(
					main.getByRole("heading", { level: 2, name: section }),
				).toBeVisible();
			}
			await expect(main).toContainText(
				`01/01/${referenceYear} - 31/12/${referenceYear}`,
			);

			const executives = main.getByRole("table", { name: /Cadres dirigeants/ });
			await expect(executives).toContainText(
				formatPercentage(EXECUTIVE_WOMEN_PERCENT),
			);
			await expect(executives).toContainText("Conforme");
			const members = main.getByRole("table", {
				name: /Membres des instances dirigeantes/,
			});
			await expect(members).toContainText(
				formatPercentage(100 - MEMBER_WOMEN_PERCENT),
			);
			await expect(members).toContainText("Non conforme");

			const publicationLink = main.getByRole("link", { name: PUBLISH_URL });
			await expect(publicationLink).toHaveAttribute("target", "_blank");
			await expect(main.getByText("Modalités de communication")).toHaveCount(0);

			await expect(
				main.getByRole("link", {
					name: "Télécharger la déclaration des indicateurs de représentation (PDF)",
				}),
			).toHaveAttribute(
				"href",
				`/api/representation-pdf?year=${referenceYear}`,
			);
			await expect(
				main
					.getByRole("link", { name: /Modifier/ })
					.or(main.getByRole("button", { name: /Modifier/ })),
			).toHaveCount(0);

			await main.getByRole("link", { name: "Mon espace", exact: true }).click();
			await page.waitForURL(urlGlob(MY_SPACE));
		});

		// Last, because it leaves Mon espace: the panel's modification entrance
		// opens the funnel on an editable step.
		await test.step("the modify button opens the editable funnel on its first step", async () => {
			await waitForDsfrModal(page, PANEL_ID);
			await clickAndExpectDialogOpen(
				page,
				page.getByRole("button", { name: "Représentation", exact: true }),
				PANEL_ID,
			);

			await page
				.locator(`#${PANEL_ID}`)
				.getByRole("link", { name: "Modifier" })
				.click();
			await page.waitForURL(
				urlGlob(representationStepHref(FIRST_REPRESENTATION_STEP)),
			);

			// A read-only step exposes a "Suivant" link; an editable one a button.
			await expect(
				page.getByRole("button", { name: "Suivant", exact: true }),
			).toBeVisible();
			await expect(
				page.getByRole("link", { name: "Suivant", exact: true }),
			).toHaveCount(0);
		});
	});
});

test.describe("Représentation équilibrée — écarts non calculables", () => {
	test.describe.configure({ mode: "serial" });

	let campaignYear: number;
	let referenceYear: number;
	let seededYears: number[] = [];

	test.beforeAll(async () => {
		campaignYear = getCurrentRepresentationCampaignYear();
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
		await expect(page.getByText("Non calculable").first()).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Publication" }),
		).toHaveCount(0);
		await expect(
			page.getByRole("heading", { name: "Prochaines étapes" }),
		).toHaveCount(0);

		await page.goto(`${FUNNEL_ROOT}/etape/4`);
		await expect(
			page.getByRole("status").getByRole("heading", {
				name: "L’étape de publication n’est pas nécessaire",
			}),
		).toBeVisible();
		await page
			.getByRole("link", { name: "Continuer vers le récapitulatif" })
			.click();
		await expectOnStep(page, 5, "Récapitulatif");
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
		campaignYear = getCurrentRepresentationCampaignYear();
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
		await expect(
			page.getByText(
				"Indiquez si votre entreprise a employé au moins 1 000 salariés durant les trois derniers exercices consécutifs.",
			),
		).toBeVisible();

		await chooseRadio(page, /Moins de 1 000 salariés/);

		const notice = page
			.locator("div.fr-background-alt--blue-france")
			.filter({ hasText: "Votre entreprise n'est pas assujettie" });
		await expect(notice.locator("p")).toHaveText([
			"Votre entreprise n'est pas assujettie à la publication et à la déclaration des écarts éventuels de représentation entre les femmes et les hommes.",
			"Vous pouvez cliquer sur valider pour confirmer.",
		]);
		// Two independent sentences, two paragraphs: the <br /> this wording replaced
		// fabricated a structure that read as a single block.
		await expect(notice.locator("br")).toHaveCount(0);
		// The consigne no longer dates itself with the campaign year.
		await expect(notice).not.toContainText(String(campaignYear));

		await expect(page.getByRole("button", { name: "Suivant" })).toHaveCount(0);
		await page.getByRole("button", { name: "Valider" }).click();
		await page.waitForURL(urlGlob(MY_SPACE));
	});

	test("Mon espace records the non-subjection as a result, with no deadline and no récapitulatif", async ({
		page,
	}) => {
		await page.goto(MY_SPACE);

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

		const consultation = await page.goto(
			mySpaceRepresentationHref(campaignYear),
		);
		expect(consultation?.status()).toBe(404);
	});

	test("the panel keeps the subjection step alone and offers to reopen the démarche", async ({
		page,
	}) => {
		await page.goto(MY_SPACE);
		await waitForDsfrModal(page, PANEL_ID);
		await clickAndExpectDialogOpen(
			page,
			page.getByRole("button", { name: "Représentation", exact: true }),
			PANEL_ID,
		);

		const panel = page.locator(`#${PANEL_ID}`);
		await expect(
			panel.getByText(
				"Votre entreprise n'est pas assujettie à la publication et à la déclaration des écarts éventuels de représentation entre les femmes et les hommes.",
			),
		).toBeVisible();
		// A follow-up view carries no Valider button, so it drops the funnel's second sentence.
		await expect(panel.getByText(/cliquer sur valider/)).toHaveCount(0);
		await expect(
			panel.getByText("Vérification de l'assujettissement"),
		).toBeVisible();

		// Neither the declaration step nor the Rixain reminder applies below the threshold.
		await expect(panel.getByText(/Écarts de représentation/)).toHaveCount(0);
		await expect(panel.getByText(/loi Rixain/)).toHaveCount(0);

		// A non-subjection is stored as a `done` declaration: nothing was ever
		// transmitted, so the transmission line must not follow the status alone.
		await expect(
			panel.getByText("Votre déclaration a été transmise"),
		).toHaveCount(0);

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

		await page.goto(MY_SPACE);
		const row = page.getByRole("row", { name: /Représentation/ });
		await expect(row).toContainText(
			"Écarts de représentation - Cadres dirigeants",
		);
		await expect(row).toContainText("En cours");
		await expect(row).not.toContainText("Non-assujetti");
	});
});
