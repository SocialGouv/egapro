import { expect, test } from "@playwright/test";
import { setupComplianceState } from "./helpers/compliance";
import {
	COMPLIANCE_PATH,
	fillCseStep1,
	selectCompliancePath,
	submitCseStep2,
	submitSecondDeclaration,
	uploadJointEvalPdf,
} from "./helpers/compliance-flows";

test.describe.configure({ mode: "serial" });

const CONFIRMATION_PATH = `${COMPLIANCE_PATH}/confirmation`;

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
		await submitSecondDeclaration(page, "**/avis-cse/**");
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
		await submitSecondDeclaration(page, `**${CONFIRMATION_PATH}`);
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
		await submitSecondDeclaration(page, `**${COMPLIANCE_PATH}`);
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
		await expect(page).toHaveURL(/avis-cse/);
	});
});
