import { expect, test } from "@playwright/test";
import {
	COMPLIANCE_PATH,
	completeSecondDeclaration,
	fillCseStep1,
	selectCompliancePath,
	submitCseStep2,
	uploadJointEvalPdf,
} from "./helpers/compliance-flows";
import { resetDeclarationToDraft, setCompanyHasCse } from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";

test.describe.configure({ mode: "serial" });

const CONFIRMATION_PATH = `${COMPLIANCE_PATH}/confirmation`;

// === GROUP A: No gap — auto-redirects ===

test.describe("Path 1: no gap + hasCse → /avis-cse → full CSE flow", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
	});

	test("complete declaration without gap, then CSE opinion flow", async ({
		page,
	}) => {
		test.slow(); // Full declaration (6 steps) + CSE step 1 + CSE step 2
		await completeDeclaration(page, { hasGap: false });

		// No gap + hasCse → auto-redirect to /avis-cse
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
		await fillCseStep1(page, false);
		await submitCseStep2(page);
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("Path 2: no gap + no hasCse → /confirmation", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
	});

	test("complete declaration without gap, redirects to confirmation", async ({
		page,
	}) => {
		await completeDeclaration(page, { hasGap: false });

		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

// === GROUP B: Gap — compliance choice form ===

test.describe("Path 3: gap + hasCse → compliance choice → justify", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
	});

	test("complete declaration with gap, shows 3 compliance options", async ({
		page,
	}) => {
		await completeDeclaration(page, { hasGap: true });

		// Gap + hasCse → compliance choice page
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
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

test.describe("Path 4: gap + hasCse → joint evaluation → /avis-cse", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
	});

	test("complete declaration with gap, joint evaluation → CSE", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance choice + joint eval upload
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
	});
});

test.describe("Path 5: gap + no hasCse → joint evaluation → /confirmation", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
	});

	test("shows all 3 options including justify (hasCse=false)", async ({
		page,
	}) => {
		await completeDeclaration(page, { hasGap: true });
		await expect(
			page.getByText("Justifier les écarts de rémunération ≥ 5 %", {
				exact: true,
			}),
		).toBeVisible();
	});

	test("joint evaluation → upload PDF → /confirmation", async ({ page }) => {
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
	});
});

// === GROUP C: Corrective action — second declaration (no remaining gap) ===

test.describe("Path 6: gap + corrective action (no gap after) + hasCse → /avis-cse", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
	});

	test("declaration → corrective action → correct without gap → /avis-cse", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second declaration
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: false });
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
	});
});

test.describe("Path 7: gap + corrective action (no gap after) + no hasCse → /confirmation", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
	});

	test("declaration → corrective action → correct without gap → /confirmation", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second declaration
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: false });
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
	});
});

// === GROUP D: Corrective action with remaining gap → second round ===

test.describe("Path 8: gap + corrective action (gap persists) → second round choices", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
	});

	test("declaration → corrective action → correct WITH gap → back to compliance choice", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second declaration
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		// Gap still exists → redirect back to compliance choice
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
	});

	test("second round shows only justify and joint evaluation (no corrective action)", async ({
		page,
	}) => {
		await page.goto(COMPLIANCE_PATH);
		await expect(
			page.getByText("Justifier les écarts de rémunération ≥ 5 %", {
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByText("Évaluation conjointe des rémunérations", {
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByText("Actions correctives et seconde déclaration", {
				exact: true,
			}),
		).not.toBeVisible();
	});

	test("second round: justify → navigates to /avis-cse/etape/1", async ({
		page,
	}) => {
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });
	});
});

test.describe("Path 10: second round + joint evaluation + hasCse → /avis-cse", () => {
	test.beforeAll(async () => {
		// Fresh run: declaration → corrective action with gap → second round
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
	});

	test("full flow → second round → joint evaluation → /avis-cse", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second decl + second round
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		// Now in second round
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
	});
});

test.describe("Path 11: second round + joint evaluation + no hasCse → /confirmation", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
	});

	test("full flow → second round → joint evaluation → /confirmation", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second decl + second round
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
	});
});

// === GROUP F: Redirect guard (complianceCompletedAt) ===

test.describe("Path 12: compliance already completed → redirect", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
	});

	test("complete full flow, then verify compliance path redirects away", async ({
		page,
	}) => {
		test.slow(); // Full declaration + CSE step 1 + CSE step 2 + redirect check
		// Complete declaration without gap → auto-redirect to CSE → complete CSE
		await completeDeclaration(page, { hasGap: false });
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
		await fillCseStep1(page, false);
		await submitCseStep2(page);

		// complianceCompletedAt is now set — navigating back should redirect
		await page.goto(COMPLIANCE_PATH);
		await page.waitForURL(
			(url) => !url.pathname.endsWith("/parcours-conformite"),
			{ timeout: 10_000 },
		);
		await expect(page).toHaveURL(/avis-cse/);
	});
});
