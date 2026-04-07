import { expect, test } from "@playwright/test";

import {
	deleteCampaignDeadlines,
	getTestDeclarationYear,
	resetDeclarationToDraft,
	setCampaignDeadlines,
	setCompanyHasCse,
	setDeclarationComplianceState,
} from "./helpers/db";
import { loginWithProConnect } from "./helpers/login";

const PANEL_ID = "declaration-process-panel";
let testDeclarationYear: number;

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

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setDeclarationComplianceState({
			status: "submitted",
			currentStep: 6,
			compliancePath: "corrective_action",
		});
		testDeclarationYear = await getTestDeclarationYear();
	});

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

			const panel = page.locator(`#${PANEL_ID}`);
			await page.getByRole("button", { name: "Rémunération" }).first().click();
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

			const panel = page.locator(`#${PANEL_ID}`);
			await page.getByRole("button", { name: "Rémunération" }).first().click();
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

			await page.goto("/declaration-remuneration/etape/2");
			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/6$/);
		});
	});
});
