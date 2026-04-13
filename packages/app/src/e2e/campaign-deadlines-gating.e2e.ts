import { expect, type Page, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";

import {
	deleteCampaignDeadlines,
	resetDeclarationToDraft,
	setCampaignDeadlines,
	setCompanyHasCse,
	setDeclarationComplianceState,
	setUserPhone,
} from "./helpers/db";
import { loginWithProConnect } from "./helpers/login";

const PANEL_ID = "declaration-process-panel";
// Match the year that api.declaration.getOrCreate() uses on first login.
const testDeclarationYear = getCurrentYear();

/** Wait for DSFR JS to finish initializing both the modal and its trigger button. */
async function waitForDsfrReady(page: Page) {
	await page.waitForFunction(
		(id) => {
			const dialog = document.getElementById(id);
			if (dialog?.getAttribute("data-fr-js-modal") !== "true") return false;
			const btn = document.querySelector(`[aria-controls="${id}"]`);
			return btn?.getAttribute("data-fr-js-modal") === "true";
		},
		PANEL_ID,
		{ timeout: 10_000 },
	);
}

const FUTURE_DEADLINES = {
	decl1ModificationDeadline: "2099-06-01",
	decl1JustificationDeadline: "2099-06-01",
	decl1JointEvaluationDeadline: "2099-08-01",
	decl2ModificationDeadline: "2099-12-01",
	decl2JustificationDeadline: "2099-12-01",
	decl2JointEvaluationDeadline: "2100-02-01",
} as const;

const PAST_DEADLINES = {
	decl1ModificationDeadline: "2020-06-01",
	decl1JustificationDeadline: "2020-06-01",
	decl1JointEvaluationDeadline: "2020-08-01",
	decl2ModificationDeadline: "2020-12-01",
	decl2JustificationDeadline: "2020-12-01",
	decl2JointEvaluationDeadline: "2021-02-01",
} as const;

test.describe("Campaign deadlines gating", () => {
	test.describe.configure({ mode: "serial" });
	test.setTimeout(90_000);

	// Ensure the declaration row exists and is in the expected compliance state.
	// Runs before each test since the DB helpers are UPDATE-only — the row must
	// first be created by api.declaration.getOrCreate() at login time, which the
	// shared auth.setup project handles.
	async function seedSubmittedCompliance() {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setUserPhone("0122334455");
		await setDeclarationComplianceState({
			status: "submitted",
			currentStep: 6,
			compliancePath: "corrective_action",
		});
	}

	test.afterAll(async () => {
		await deleteCampaignDeadlines(testDeclarationYear);
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
	});

	test.describe("Deadline in the future", () => {
		test.beforeAll(async () => {
			await setCampaignDeadlines(testDeclarationYear, FUTURE_DEADLINES);
		});

		test("panel shows Modifier link and 'Modifiable jusqu'au' text", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			// The declaration row is only created by getOrCreate() when visiting a
			// /declaration-remuneration page. /mon-espace does not trigger it, so we
			// navigate there once before seeding, then go back to /mon-espace.
			await page.goto("/declaration-remuneration");
			await seedSubmittedCompliance();
			await page.goto("/mon-espace");
			await waitForDsfrReady(page);

			const panel = page.locator(`#${PANEL_ID}`);
			const remuButton = page.getByRole("button", { name: "Rémunération" });
			await expect(remuButton.first()).toBeVisible();
			await remuButton.first().click();
			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });

			await expect(
				panel.getByText("Votre déclaration a été transmise"),
			).toBeVisible();
			await expect(panel.getByText(/Modifiable jusqu'au/)).toBeVisible();

			const modifyLink = panel.getByRole("link", { name: "Modifier" }).first();
			await expect(modifyLink).toBeVisible();
			await expect(modifyLink).toHaveAttribute(
				"href",
				/\/declaration-remuneration\/etape\/1/,
			);
		});

		test("submitted declaration can re-enter a non-recap step", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await page.goto("/declaration-remuneration");
			await seedSubmittedCompliance();

			await page.goto("/declaration-remuneration/etape/2");
			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/2$/);
		});
	});

	test.describe("Deadline in the past", () => {
		test.beforeAll(async () => {
			await setCampaignDeadlines(testDeclarationYear, PAST_DEADLINES);
		});

		test("panel hides Modifier link and shows 'Modification close depuis'", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await page.goto("/declaration-remuneration");
			await seedSubmittedCompliance();
			await page.goto("/mon-espace");
			await waitForDsfrReady(page);

			const panel = page.locator(`#${PANEL_ID}`);
			const remuButton = page.getByRole("button", { name: "Rémunération" });
			await expect(remuButton.first()).toBeVisible();
			await remuButton.first().click();
			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });

			await expect(
				panel.getByText("Votre déclaration a été transmise"),
			).toBeVisible();
			await expect(
				panel.getByText(/Modification close depuis le/),
			).toBeVisible();
			await expect(panel.getByRole("link", { name: "Modifier" })).toHaveCount(
				0,
			);
		});

		test("submitted declaration non-recap step redirects to recap", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await page.goto("/declaration-remuneration");
			await seedSubmittedCompliance();

			await page.goto("/declaration-remuneration/etape/2");
			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/6$/);
		});
	});
});
