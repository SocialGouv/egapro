import { expect, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";
import {
	resetDeclarationToDraft,
	setCompanyHasCse,
	setDeclarationComplianceState,
	setUserPhone,
} from "./helpers/db";
import {
	deleteCampaignDeadlines,
	setCampaignDeadlines,
} from "./helpers/db-campaign";
import { loginWithProConnect } from "./helpers/login";

// The panel's deadline-based rendering (Modifier link + "Modifiable jusqu'au" vs
// "Modification close depuis" when the deadline has passed) is covered by
// src/modules/my-space/__tests__/DeclarationProcessPanel.test.tsx
// ("modify button gating by deadline"). What remains here is the route-level
// gating that no component test can exercise: a submitted declaration can still
// re-enter a non-recap step, editable before the deadline and read-only after
// (#3716).

// Match the year that api.declaration.getOrCreate() uses on first login.
const testDeclarationYear = getCurrentYear();

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
		await setDeclarationComplianceState({
			status: "corrective_actions_chosen",
			currentStep: 6,
			firstDeclarationPathChoice: "corrective_action",
		});
	}

	// Phone + CSE flags must be set before login so the JWT picks them up and
	// the missing-info-modal does not intercept clicks on /mon-espace.
	async function seedUserProfile() {
		await setUserPhone("0122334455");
		await setCompanyHasCse(true);
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

		test("submitted declaration can re-enter a non-recap step", async ({
			page,
		}) => {
			await seedUserProfile();
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

		test("submitted declaration re-enters a non-recap step in read-only", async ({
			page,
		}) => {
			await seedUserProfile();
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await page.goto("/declaration-remuneration");
			await seedSubmittedCompliance();

			// After the deadline the step no longer redirects to the recap (#3716):
			// it stays navigable but renders the modification-closed read-only banner.
			await page.goto("/declaration-remuneration/etape/2");
			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/2$/);
			await expect(
				page.getByText(/modification close depuis le/i),
			).toBeVisible();
		});
	});
});
