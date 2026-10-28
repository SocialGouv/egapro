import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

import {
	API_UPLOAD,
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	CSE_OPINION_CONFIRMATION,
	complianceStepHref,
	cseOpinionStepHref,
} from "~/modules/routes";
// Leaf module, not the barrel: the Playwright runner cannot load the CSS
// modules the barrel pulls in through its React components.
import { SUBMIT_LABEL } from "~/modules/shared/submitLabels";
import {
	categoryWorkforceInput,
	fillCategoryPayAmounts,
	STEP5_WORKFORCE_REMINDER,
} from "./declaration-flows";
import { urlGlob } from "./routes";

export const DUMMY_PDF = path.join(
	import.meta.dirname,
	"../fixtures/dummy.pdf",
);

type CseStep1Options = {
	hasSecondDeclaration?: boolean;
	/** The justification opinion is asked: gap ≥ 5 % qualified "all" or "partial" on the first declaration. */
	firstDeclJustification?: boolean;
	/** Same, for the corrective (second) declaration. */
	secondDeclJustification?: boolean;
	/** Opinion on accuracy and justification. Defaults to "favorable" so existing specs are unaffected. */
	opinion?: "favorable" | "unfavorable";
};

async function fillOpinionCard(
	page: Page,
	idPrefix: string,
	date: string,
	opinion: "favorable" | "unfavorable",
) {
	await expect(page.locator(`#${idPrefix}-legend`)).toBeVisible();
	// DSFR hides native radio inputs — click on the associated label instead
	await page.locator(`label[for="${idPrefix}-${opinion}"]`).click();
	await page.locator(`#${idPrefix}-date`).fill(date);
}

async function fillJustificationCard(
	page: Page,
	idPrefix: string,
	required: boolean,
	date: string,
	opinion: "favorable" | "unfavorable",
) {
	if (!required) {
		await expect(page.locator(`#${idPrefix}-legend`)).toHaveCount(0);
		return;
	}
	await fillOpinionCard(page, idPrefix, date, opinion);
}

export async function fillCseStep1(page: Page, options: CseStep1Options = {}) {
	const {
		hasSecondDeclaration = false,
		firstDeclJustification = false,
		secondDeclJustification = false,
		opinion = "favorable",
	} = options;
	await test.step("avis CSE — étape 1 : avis rendus", async () => {
		await page.waitForURL(urlGlob(cseOpinionStepHref(1)));
		await fillOpinionCard(page, "first-decl-accuracy", "2025-03-15", opinion);
		await fillJustificationCard(
			page,
			"first-decl-gap",
			firstDeclJustification,
			"2025-03-15",
			opinion,
		);
		if (hasSecondDeclaration) {
			await fillOpinionCard(
				page,
				"second-decl-accuracy",
				"2025-06-15",
				opinion,
			);
			await fillJustificationCard(
				page,
				"second-decl-gap",
				secondDeclJustification,
				"2025-06-15",
				opinion,
			);
		} else {
			await expect(page.locator("#second-decl-accuracy-legend")).toHaveCount(0);
		}
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL(urlGlob(cseOpinionStepHref(2)));
	});
}

// A matrix column to associate to the uploaded file, expressed the way the UI
// exposes it (declaration number + content type), not as a database row.
type CseColumn = { declarationNumber: 1 | 2; type: "accuracy" | "gap" };

const CSE_TYPE_LABELS = {
	accuracy: "Exactitude",
	gap: "Justification",
} as const;
const CSE_DECLARATION_LABELS = {
	1: "1re déclaration",
	2: "2e déclaration",
} as const;

// Mirror of checkboxLabel() in ContentTypeMatrix.tsx — the accessible name of a
// matrix checkbox. The declaration segment is omitted in single-declaration mode.
function cseCheckboxName(
	column: CseColumn,
	fileName: string,
	hasSecondDeclaration: boolean,
): string {
	const declarationPart = hasSecondDeclaration
		? ` — ${CSE_DECLARATION_LABELS[column.declarationNumber]}`
		: "";
	return `${CSE_TYPE_LABELS[column.type]}${declarationPart} — ${fileName}`;
}

// Neither the HTTP status nor the body can gate on persistence here. The tRPC
// client uses httpBatchStreamLink: headers go out before the procedure runs and
// stay 200 even when it throws, and the streamed body is no longer retrievable
// through CDP once the page has consumed it — `response.text()` inside a
// waitForResponse predicate fails with `Network.getResponseBody: No data found
// for resource`. What removes the race is the client itself: Step2Upload blocks
// submission while setFileContentTypes is in flight and rolls the matrix back
// when it fails (#4102), so matching the mutation's URL is enough here.

/**
 * Complete CSE step 2 through the real UI: upload the PDF, associate the required
 * content types via the matrix (or, with a single required column, check that the
 * page pre-associated and locked it), then submit and certify. Exercises the matrix
 * introduced by epic #3476 instead of injecting rows directly in the database.
 */
export async function submitCseStep2(
	page: Page,
	options: { columns?: CseColumn[]; hasSecondDeclaration?: boolean } = {},
) {
	const {
		columns = [{ declarationNumber: 1, type: "accuracy" }],
		hasSecondDeclaration = false,
	} = options;
	const fileName = path.basename(DUMMY_PDF);

	await test.step("avis CSE — étape 2 : dépôt des fichiers", async () => {
		await page.waitForURL(urlGlob(cseOpinionStepHref(2)));

		// Phase A — selecting the file auto-uploads it (no intermediate "Importer"
		// step), after which the page re-renders with the matrix.
		await page.locator("#cse-file-upload").setInputFiles(DUMMY_PDF);
		const matrix = page.getByRole("table", {
			name: /Associez chaque fichier déposé/,
		});
		await expect(matrix).toBeVisible({ timeout: 30_000 });

		// Phase B — a single column is auto-associated before any listener could
		// attach, so its save is awaited through the submit button instead.
		const [onlyColumn] = columns;
		if (columns.length === 1 && onlyColumn) {
			const lockedCheckbox = matrix.getByRole("checkbox", {
				name: cseCheckboxName(onlyColumn, fileName, hasSecondDeclaration),
			});
			await expect(matrix.getByRole("checkbox")).toHaveCount(1);
			await expect(lockedCheckbox).toBeChecked();
			await expect(lockedCheckbox).toBeDisabled();
		} else {
			for (const column of columns) {
				const persisted = page.waitForResponse((response) =>
					response.url().includes("setFileContentTypes"),
				);
				await page
					.getByRole("checkbox", {
						name: cseCheckboxName(column, fileName, hasSecondDeclaration),
					})
					.check();
				await persisted;
			}
		}

		// Phase C — submit, certify, validate, then wait for the confirmation page.
		const submit = page.getByRole("button", {
			exact: true,
			name: SUBMIT_LABEL,
		});
		await expect(submit).toBeEnabled();
		await submit.click();
		await page
			.getByText(/Je certifie que les avis transmis sont conformes/)
			.click();
		await page.getByRole("button", { name: "Valider" }).click();
		await page.waitForURL(urlGlob(CSE_OPINION_CONFIRMATION), {
			timeout: 30_000,
		});
	});
}

/**
 * Deposit files on CSE step 2, one upload request per entry — the form
 * auto-uploads on selection. Lets a caller observe what a deposit alone
 * triggers, before anything is submitted (#4300).
 */
export async function uploadCseFiles(page: Page, fileNames: string[]) {
	await page.waitForURL(urlGlob(cseOpinionStepHref(2)));
	const pdf = await readFile(DUMMY_PDF);
	for (const name of fileNames) {
		const uploaded = page.waitForResponse(
			(response) =>
				response.url().includes(API_UPLOAD) &&
				response.request().method() === "POST",
		);
		await page
			.locator("#cse-file-upload")
			.setInputFiles([{ name, mimeType: "application/pdf", buffer: pdf }]);
		await uploaded;
		await expect(page.getByText(name, { exact: false }).first()).toBeVisible({
			timeout: 30_000,
		});
	}
}

/**
 * Associate deposited files to matrix columns. A column holds exactly one file,
 * so each pairing is explicit. Each wait matches its own mutation rather than
 * the next response to arrive: the payload is cumulative, so the response
 * carrying this column proves every association ticked so far reached the
 * server, which the optimistic submit gate does not.
 */
export async function associateCseContentTypes(
	page: Page,
	assignments: { column: CseColumn; fileName: string }[],
	options: { hasSecondDeclaration?: boolean } = {},
) {
	const { hasSecondDeclaration = false } = options;
	for (const { column, fileName } of assignments) {
		const persisted = page.waitForResponse((response) => {
			if (!response.url().includes("setFileContentTypes")) {
				return false;
			}
			const requestBody = response.request().postData() ?? "";
			return (
				requestBody.includes(`"type":"${column.type}"`) &&
				requestBody.includes(`"declarationNumber":${column.declarationNumber}`)
			);
		});
		await page
			.getByRole("checkbox", {
				name: cseCheckboxName(column, fileName, hasSecondDeclaration),
			})
			.check();
		await persisted;
	}
}

/** Submit CSE step 2: certify, validate, then land on the confirmation page. */
export async function submitCseOpinion(page: Page) {
	const submit = page.getByRole("button", { exact: true, name: SUBMIT_LABEL });
	await expect(submit).toBeEnabled();
	await submit.click();
	await page
		.getByText(/Je certifie que les avis transmis sont conformes/)
		.click();
	await page.getByRole("button", { name: "Valider" }).click();
	await page.waitForURL(urlGlob(CSE_OPINION_CONFIRMATION), { timeout: 30_000 });
}

export async function uploadJointEvalPdf(page: Page) {
	await test.step("dépôt du rapport d'évaluation conjointe", async () => {
		await page.waitForURL(urlGlob(COMPLIANCE_JOINT_EVALUATION));
		await page
			.locator("#joint-evaluation-file-upload")
			.setInputFiles(DUMMY_PDF);
		await page.getByRole("button", { exact: true, name: SUBMIT_LABEL }).click();
		await page
			.getByText(/Je certifie que le rapport transmis est conforme/)
			.click();
		await page.getByRole("button", { name: "Valider" }).click();
	});
}

export type GapJustificationAnswer = "all" | "partial" | "none";

export const GAP_JUSTIFICATION_TITLES: Record<GapJustificationAnswer, string> =
	{
		all: "Tous les écarts de rémunération ≥ 5 % sont justifiables",
		partial: "Une partie des écarts de rémunération ≥ 5 % est justifiable",
		none: "Aucun écart de rémunération ≥ 5 % n'est justifiable",
	};

export const CORRECTIVE_PATH_TITLE =
	"Effectuer des actions correctives et une seconde déclaration";
export const JOINT_PATH_TITLE =
	"Mettre en place une évaluation conjointe des rémunérations";

const SECOND_ROUND_INTRO = /ont de nouveau été constatés/;

/**
 * Answer the gap-justification screen (1/2) of the path choice. In round 1, a
 * "partial" or "none" answer opens the path screen (2/2) on `?ecran=parcours`; in
 * round 2, and for "all", "Suivant" saves the path straight away.
 */
export async function answerGapJustification(
	page: Page,
	answer: GapJustificationAnswer,
) {
	// DSFR hides native radio inputs — click on the associated label instead
	await page.locator(`label[for="gap-justification-${answer}"]`).click();
	await page.getByRole("button", { name: "Suivant" }).click();
}

/** The path screen (2/2) of round 1, reached from a "partial" or "none" answer. */
export async function expectPathScreen(
	page: Page,
	answer: Exclude<GapJustificationAnswer, "all">,
) {
	await expect(
		page.getByRole("heading", {
			level: 2,
			name: GAP_JUSTIFICATION_TITLES[answer],
		}),
	).toBeVisible();
	await expect(page.locator('label[for="path-corrective"]')).toBeVisible();
	await expect(page.locator('label[for="path-joint"]')).toBeVisible();
	await expect(page.locator("#gap-justification-all")).toHaveCount(0);
}

/**
 * Choose a compliance path through the two-step UI: qualify the gaps, then — in
 * round 1 only, for a non-justified gap — pick the path. `gapJustification`
 * selects which non-justified answer leads there; "all" is implied by justify.
 */
export async function selectCompliancePath(
	page: Page,
	pathId: "path-corrective" | "path-joint" | "path-justify",
	options: { gapJustification?: "partial" | "none" } = {},
) {
	const { gapJustification = "partial" } = options;
	await test.step("choix du parcours de conformité", async () => {
		await page.goto(COMPLIANCE_PATH);
		await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 10_000 });
		await expect(
			page.locator('label[for="gap-justification-all"]'),
		).toBeVisible();
		if (pathId === "path-justify") {
			await answerGapJustification(page, "all");
			return;
		}
		const isSecondRound = await page.getByText(SECOND_ROUND_INTRO).isVisible();
		if (isSecondRound) {
			expect(pathId, "round 2 offers no corrective action").toBe("path-joint");
			await answerGapJustification(page, gapJustification);
			return;
		}
		await answerGapJustification(page, gapJustification);
		await expectPathScreen(page, gapJustification);
		await page.locator(`label[for="${pathId}"]`).click();
		await page.getByRole("button", { name: "Suivant" }).click();
	});
}

/**
 * Complete the corrective action second declaration flow (steps 1-3).
 * Step 1 is info-only, step 2 edits correction data, step 3 reviews and submits.
 * @param hasGap Whether the correction data should still have a gap ≥ 5%
 */
export async function completeSecondDeclaration(
	page: Page,
	options: { hasGap: boolean },
) {
	await test.step("seconde déclaration", async () => {
		// Step 1: Info page — just click through
		await page.waitForURL(urlGlob(complianceStepHref(1)), { timeout: 10_000 });
		await page.getByRole("link", { name: "Suivant" }).click();
		await page.waitForURL(urlGlob(complianceStepHref(2)));

		// #4215 — on the read-only second declaration, the source line sits between the
		// intro and "Tous les champs sont obligatoires.", not after the reference period.
		const categoryBlock = page.locator("#content");
		const sourceLine = categoryBlock.getByText(
			"Source utilisée pour déterminer les catégories d'emplois",
		);
		const mandatoryLine = categoryBlock.getByText(
			"Tous les champs sont obligatoires",
		);
		await expect(sourceLine).toBeVisible();
		await expect(mandatoryLine).toBeVisible();
		const [sourceBox, mandatoryBox] = await Promise.all([
			sourceLine.boundingBox(),
			mandatoryLine.boundingBox(),
		]);
		expect(sourceBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(
			mandatoryBox?.y ?? Number.NEGATIVE_INFINITY,
		);

		// #4254 — the shared category table carries a headcount row per pay basis here
		// too, but this parcours answers to no step 1: it gets neither the reminder
		// sentence nor the coherence caps that go with it.
		await expect(
			categoryBlock.getByRole("heading", {
				name: "Nombre de salariés en effectif physique",
			}),
		).toBeVisible();
		for (const basis of ["annual", "hourly"] as const) {
			for (const sex of ["women", "men"] as const) {
				await expect(
					categoryWorkforceInput(page, { basis, sex }),
				).toBeVisible();
			}
		}
		await expect(page.getByText(STEP5_WORKFORCE_REMINDER)).toHaveCount(0);

		// Step 2: Edit correction employee category data
		// women=1000, men=1100 → 9% gap | women=1000, men=1020 → 2% gap
		const menSalary = options.hasGap ? "1100" : "1020";
		await fillCategoryPayAmounts(page, { men: menSalary, women: "1000" });

		// Fill required reference period dates
		await page.locator("#period-start-date").fill("2026-01-01");
		await page.locator("#period-end-date").fill("2026-12-31");

		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL(urlGlob(complianceStepHref(3)));

		// Step 3: Review and submit (opens confirmation modal)
		await page.getByRole("button", { exact: true, name: SUBMIT_LABEL }).click();
		await page
			.getByText(/Je certifie que les données saisies sont exactes/)
			.click();
		await page.getByRole("button", { name: "Valider" }).click();
		await expect(page.locator("#submit-declaration-modal")).not.toBeVisible();
	});
}
