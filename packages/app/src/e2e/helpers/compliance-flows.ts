import path from "node:path";
import { expect, type Page } from "@playwright/test";

const DUMMY_PDF = path.join(import.meta.dirname, "../fixtures/dummy.pdf");
export const COMPLIANCE_PATH = "/declaration-remuneration/parcours-conformite";

type CseStep1Options = {
	hasSecondDeclaration?: boolean;
	/** CSE consulted on justifying the first declaration's gaps ≥ 5% — adds the "Justification" column in step 2 when that declaration has a gap. */
	firstDeclGapConsulted?: boolean;
	/** Same, for the corrective (second) declaration. */
	secondDeclGapConsulted?: boolean;
};

// Fill one GapConsultationCard: consulted yes/no, and when yes the opinion + date.
async function fillGapConsultation(
	page: Page,
	idPrefix: string,
	consulted: boolean,
	date: string,
) {
	if (!consulted) {
		await page.locator(`label[for="${idPrefix}-no"]`).click();
		return;
	}
	await page.locator(`label[for="${idPrefix}-yes"]`).click();
	await page.locator(`label[for="${idPrefix}-favorable"]`).click();
	await page.locator(`#${idPrefix}-date`).fill(date);
}

export async function fillCseStep1(page: Page, options: CseStep1Options = {}) {
	const {
		hasSecondDeclaration = false,
		firstDeclGapConsulted = false,
		secondDeclGapConsulted = false,
	} = options;
	await page.waitForURL("**/avis-cse/etape/1");
	// DSFR hides native radio inputs — click on the associated label instead
	await page.locator('label[for="first-decl-accuracy-favorable"]').click();
	await page.locator("#first-decl-accuracy-date").fill("2025-03-15");
	await fillGapConsultation(
		page,
		"first-decl-gap",
		firstDeclGapConsulted,
		"2025-03-15",
	);
	if (hasSecondDeclaration) {
		await page.locator('label[for="second-decl-accuracy-favorable"]').click();
		await page.locator("#second-decl-accuracy-date").fill("2025-06-15");
		await fillGapConsultation(
			page,
			"second-decl-gap",
			secondDeclGapConsulted,
			"2025-06-15",
		);
	}
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/avis-cse/etape/2");
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

/**
 * Complete CSE step 2 through the real UI: upload the PDF, associate the required
 * content types via the matrix, then submit and certify. Exercises the matrix
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

	await page.waitForURL("**/avis-cse/etape/2");

	// Phase A — selecting the file auto-uploads it (no intermediate "Importer"
	// step), after which the page re-renders with the matrix.
	await page.locator("#cse-file-upload").setInputFiles(DUMMY_PDF);
	await expect(
		page.getByRole("table", { name: /Associez chaque fichier déposé/ }),
	).toBeVisible({ timeout: 30_000 });

	// Phase B — tick the required columns, waiting for each association to persist
	// before submitting. The client submit gate is optimistic, so finalize could
	// otherwise race the setFileContentTypes mutation.
	for (const column of columns) {
		const persisted = page.waitForResponse(
			(response) =>
				response.url().includes("setFileContentTypes") && response.ok(),
		);
		await page
			.getByRole("checkbox", {
				name: cseCheckboxName(column, fileName, hasSecondDeclaration),
			})
			.check();
		await persisted;
	}

	// Phase C — submit, certify, validate, then wait for the confirmation page.
	const submit = page.getByRole("button", { name: "Soumettre" });
	await expect(submit).toBeEnabled();
	await submit.click();
	await page
		.getByText(/Je certifie que les avis transmis sont conformes/)
		.click();
	await page.getByRole("button", { name: "Valider" }).click();
	await page.waitForURL("**/avis-cse/confirmation", { timeout: 30_000 });
}

export async function uploadJointEvalPdf(page: Page) {
	await page.waitForURL("**/evaluation-conjointe");
	await page.locator("#joint-evaluation-file-upload").setInputFiles(DUMMY_PDF);
	await page.getByRole("button", { name: "Transmettre" }).click();
	await page
		.getByText(/Je certifie que le rapport transmis est conforme/)
		.click();
	await page.getByRole("button", { name: "Valider" }).click();
}

export async function selectCompliancePath(
	page: Page,
	pathId: "path-corrective" | "path-joint" | "path-justify",
) {
	await page.goto(COMPLIANCE_PATH);
	await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
	// DSFR hides native radio inputs — click on the associated label instead
	await page.locator(`label[for="${pathId}"]`).click();
	await page.getByRole("button", { name: "Suivant" }).click();
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
	// Step 1: Info page — just click through
	await page.waitForURL(`**${COMPLIANCE_PATH}/etape/1`, { timeout: 10_000 });
	await page.getByRole("link", { name: "Suivant" }).click();
	await page.waitForURL(`**${COMPLIANCE_PATH}/etape/2`);

	// Step 2: Edit correction employee category data
	// women=1000, men=1100 → 9% gap | women=1000, men=1020 → 2% gap
	const menSalary = options.hasGap ? "1100" : "1020";
	await page
		.getByRole("textbox", {
			name: "Salaire de base annuel femmes, catégorie 1",
		})
		.fill("1000");
	await page
		.getByRole("textbox", {
			name: "Salaire de base annuel hommes, catégorie 1",
		})
		.fill(menSalary);

	// Fill required reference period dates
	await page.locator("#period-start-date").fill("2026-01-01");
	await page.locator("#period-end-date").fill("2026-12-31");

	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL(`**${COMPLIANCE_PATH}/etape/3`);

	// Step 3: Review and submit (opens confirmation modal)
	await page.getByRole("button", { name: "Soumettre" }).click();
	await page
		.getByText(/Je certifie que les données saisies sont exactes/)
		.click();
	await page.getByRole("button", { name: "Valider" }).click();
}
