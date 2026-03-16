import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { setupComplianceState } from "./helpers/compliance";

test.describe.configure({ mode: "serial" });

const DUMMY_PDF = path.join(import.meta.dirname, "fixtures/dummy.pdf");
const COMPLIANCE_PATH = "/declaration-remuneration/parcours-conformite";
const CONFIRMATION_PATH = `${COMPLIANCE_PATH}/confirmation`;

// --- Shared flow helpers ---

async function fillCseStep1(page: Page, hasSecondDeclaration = false) {
	await page.waitForURL("**/avis-cse/etape/1");
	// DSFR hides native radio inputs — click on the associated label instead
	await page.locator('label[for="first-decl-accuracy-favorable"]').click();
	await page.locator("#first-decl-accuracy-date").fill("2025-03-15");
	await page.locator('label[for="first-decl-gap-no"]').click();
	if (hasSecondDeclaration) {
		await page.locator('label[for="second-decl-accuracy-favorable"]').click();
		await page.locator("#second-decl-accuracy-date").fill("2025-06-15");
		await page.locator('label[for="second-decl-gap-no"]').click();
	}
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/avis-cse/etape/2");
}

async function submitCseStep2(page: Page) {
	await page.locator("#cse-file-upload").setInputFiles(DUMMY_PDF);
	await page.getByRole("button", { name: "Soumettre" }).click();
	await page
		.getByText(/Je certifie que les avis transmis sont conformes/)
		.click();
	await page.getByRole("button", { name: "Valider" }).click();
	await page.waitForURL("**/avis-cse/confirmation");
}

async function uploadJointEvalPdf(page: Page) {
	await page.waitForURL("**/evaluation-conjointe");
	await page.locator("#joint-evaluation-file-upload").setInputFiles(DUMMY_PDF);
	await page.getByRole("button", { name: "Transmettre" }).click();
	await page
		.getByText(/Je certifie que le rapport transmis est conforme/)
		.click();
	await page.getByRole("button", { name: "Valider" }).click();
}

async function selectCompliancePath(
	page: Page,
	pathId: "path-corrective" | "path-joint" | "path-justify",
) {
	await page.goto(COMPLIANCE_PATH);
	await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
	// DSFR hides native radio inputs — click on the associated label instead
	await page.locator(`label[for="${pathId}"]`).click();
	await page.getByRole("button", { name: "Suivant" }).click();
}

// === GROUP A: No gap — auto-redirects ===

test.describe("Path 1: no gap + hasCse → /avis-cse → full CSE flow", () => {
	test.beforeAll(async () => {
		await setupComplianceState({ hasCse: true, hasInitialGap: false });
	});

	test("redirects to /avis-cse and completes CSE opinion flow", async ({
		page,
	}) => {
		await page.goto(COMPLIANCE_PATH);
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
		await fillCseStep1(page, false);
		await submitCseStep2(page);
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("Path 2: no gap + no hasCse → /parcours-conformite/confirmation", () => {
	test.beforeAll(async () => {
		await setupComplianceState({ hasCse: false, hasInitialGap: false });
	});

	test("redirects to compliance confirmation page", async ({ page }) => {
		await page.goto(COMPLIANCE_PATH);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

// === GROUP B: First round — choice form ===

test.describe("Path 3: gap + justify + hasCse → /avis-cse", () => {
	test.beforeAll(async () => {
		await setupComplianceState({ hasCse: true, hasInitialGap: true });
	});

	test("shows 3 compliance options including justify (hasCse=true)", async ({
		page,
	}) => {
		await page.goto(COMPLIANCE_PATH);
		await expect(
			page.getByText("Actions correctives et seconde déclaration", {
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByText("Évaluation conjointe des rémunérations", {
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByText("Justifier les écarts de rémunération ≥ 5 %", {
				exact: true,
			}),
		).toBeVisible();
	});

	test("justify → navigates to /avis-cse/etape/1", async ({ page }) => {
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });
	});
});

test.describe("Path 4: gap + joint_evaluation + hasCse → /avis-cse", () => {
	test.beforeAll(async () => {
		await setupComplianceState({ hasCse: true, hasInitialGap: true });
	});

	test("joint_evaluation → upload PDF → navigates to /avis-cse/etape/1", async ({
		page,
	}) => {
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
	});
});

test.describe("Path 5: gap + joint_evaluation + no hasCse → /confirmation", () => {
	test.beforeAll(async () => {
		await setupComplianceState({ hasCse: false, hasInitialGap: true });
	});

	test("shows only 2 options without justify (hasCse=false)", async ({
		page,
	}) => {
		await page.goto(COMPLIANCE_PATH);
		await expect(
			page.getByText("Justifier les écarts de rémunération ≥ 5 %", {
				exact: true,
			}),
		).not.toBeVisible();
	});

	test("joint_evaluation → upload PDF → navigates to /confirmation", async ({
		page,
	}) => {
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
	});
});

// === GROUP C: Corrective action — second declaration review ===

test.describe("Path 6: corrective_action + no correction gap + hasCse → /avis-cse", () => {
	test.beforeAll(async () => {
		await setupComplianceState({
			hasCse: true,
			hasInitialGap: true,
			compliancePath: "corrective_action",
			correctionHasGap: false,
		});
	});

	test("step 3: submit second decl (no gap) → navigates to /avis-cse", async ({
		page,
	}) => {
		await page.goto(`${COMPLIANCE_PATH}/etape/3`);
		await page
			.getByText(/Je certifie que les données saisies sont exactes/)
			.click();
		await page.getByRole("button", { name: "Soumettre" }).click();
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
	});
});

test.describe("Path 7: corrective_action + no correction gap + no hasCse → /confirmation", () => {
	test.beforeAll(async () => {
		await setupComplianceState({
			hasCse: false,
			hasInitialGap: true,
			compliancePath: "corrective_action",
			correctionHasGap: false,
		});
	});

	test("step 3: submit second decl (no gap) → navigates to /confirmation", async ({
		page,
	}) => {
		await page.goto(`${COMPLIANCE_PATH}/etape/3`);
		await page
			.getByText(/Je certifie que les données saisies sont exactes/)
			.click();
		await page.getByRole("button", { name: "Soumettre" }).click();
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
	});
});

test.describe("Path 8: corrective_action + correction gap → second round choices", () => {
	test.beforeAll(async () => {
		await setupComplianceState({
			hasCse: true,
			hasInitialGap: true,
			compliancePath: "corrective_action",
			correctionHasGap: true,
		});
	});

	test("step 3: submit second decl (gap) → navigates back to compliance path", async ({
		page,
	}) => {
		await page.goto(`${COMPLIANCE_PATH}/etape/3`);
		await page
			.getByText(/Je certifie que les données saisies sont exactes/)
			.click();
		await page.getByRole("button", { name: "Soumettre" }).click();
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
	});

	test("second round shows only justify and joint_evaluation (no corrective_action)", async ({
		page,
	}) => {
		await page.goto(COMPLIANCE_PATH);
		await expect(
			page.getByText("Justifier les écarts de rémunération ≥ 5 %", {
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByText("Évaluation conjointe des rémunérations", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("Actions correctives et seconde déclaration", {
				exact: true,
			}),
		).not.toBeVisible();
	});
});

// === GROUP D: Second round ===

test.describe("Path 9: second round + justify → /avis-cse", () => {
	test.beforeAll(async () => {
		await setupComplianceState({
			hasCse: true,
			hasInitialGap: true,
			compliancePath: "corrective_action",
			secondDeclarationStatus: "submitted",
			correctionHasGap: true,
		});
	});

	test("justify → navigates to /avis-cse/etape/1", async ({ page }) => {
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });
	});
});

test.describe("Path 10: second round + joint_evaluation + hasCse → /avis-cse", () => {
	test.beforeAll(async () => {
		await setupComplianceState({
			hasCse: true,
			hasInitialGap: true,
			compliancePath: "corrective_action",
			secondDeclarationStatus: "submitted",
			correctionHasGap: true,
		});
	});

	test("joint_evaluation → upload PDF → navigates to /avis-cse", async ({
		page,
	}) => {
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
	});
});

test.describe("Path 11: second round + joint_evaluation + no hasCse → /confirmation", () => {
	test.beforeAll(async () => {
		await setupComplianceState({
			hasCse: false,
			hasInitialGap: true,
			compliancePath: "corrective_action",
			secondDeclarationStatus: "submitted",
			correctionHasGap: true,
		});
	});

	test("joint_evaluation → upload PDF → navigates to /confirmation", async ({
		page,
	}) => {
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
	});
});

// === GROUP E: Redirect guard ===

test.describe("Path 12: complianceCompletedAt set → immediate redirect", () => {
	test.beforeAll(async () => {
		await setupComplianceState({
			hasCse: true,
			hasInitialGap: true,
			complianceCompletedAt: new Date(),
		});
	});

	test("compliance already completed → redirects away from choice page", async ({
		page,
	}) => {
		await page.goto(COMPLIANCE_PATH);
		await page.waitForURL(
			(url) => !url.pathname.endsWith("/parcours-conformite"),
			{
				timeout: 10_000,
			},
		);
		// Should be on /avis-cse (hasCse=true)
		await expect(page.url()).toContain("avis-cse");
	});
});
