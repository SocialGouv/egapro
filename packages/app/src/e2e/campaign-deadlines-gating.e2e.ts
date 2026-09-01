import { expect, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";
import { TEST_USER_PHONE } from "./constants";
import { withCampaignYear } from "./helpers/campaign-year";
import {
	COMPLIANCE_PATH,
	selectCompliancePath,
} from "./helpers/compliance-flows";
import {
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
	setDeclarationComplianceState,
	setUserPhone,
} from "./helpers/db";
import {
	deleteCampaignDeadlines,
	setCampaignDeadlines,
} from "./helpers/db-campaign";
import { completeDeclaration } from "./helpers/declaration-flows";
import { loginWithProConnect } from "./helpers/login";

// Panel deadline rendering is covered by my-space/__tests__/DeclarationProcessPanel.test.tsx; this keeps the route-level re-entry gating.

// Match the year that api.declaration.getOrCreate() uses on first login.
const testDeclarationYear = getCurrentYear();

const FUTURE_DEADLINES = {
	decl1ModificationDeadline: "2099-06-01",
	decl1JustificationDeadline: "2099-06-01",
	decl1JointEvaluationDeadline: "2099-08-01",
	decl2ModificationDeadline: "2099-12-01",
	decl2JustificationDeadline: "2099-12-01",
	decl2JointEvaluationDeadline: "2100-01-01",
	decl2CseOpinionDeadline: "2100-02-01",
} as const;

const PAST_DEADLINES = {
	decl1ModificationDeadline: "2020-06-01",
	decl1JustificationDeadline: "2020-06-01",
	decl1JointEvaluationDeadline: "2020-08-01",
	decl2ModificationDeadline: "2020-12-01",
	decl2JustificationDeadline: "2020-12-01",
	decl2JointEvaluationDeadline: "2021-01-01",
	decl2CseOpinionDeadline: "2021-02-01",
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
		await setUserPhone(TEST_USER_PHONE);
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

			// After the deadline the step stays navigable but renders the read-only modification-closed banner.
			await page.goto("/declaration-remuneration/etape/2");
			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/2$/);
			await expect(
				page.getByText(/modification close depuis le/i),
			).toBeVisible();
		});
	});
});

// The path-choice deadline is the one campaign date that gates nothing (#4282).
// It is derived from the campaign year rather than read from app_campaign_deadline,
// so the only way to observe a stale one is to pin a past year: 2025 puts the
// round-2 milestone (1 January N+1) and the round-1 one (1 July N) both behind us.
const STALE_PATH_CHOICE_YEAR = 2025;
const STALE_ROUND1_DEADLINE = "1ᵉʳ juillet 2025";
const READ_ONLY_TAIL = /le choix du parcours ne peut plus être modifié/i;

test.describe("Path-choice deadline is informational, never a gate", () => {
	test.describe.configure({ mode: "serial" });

	test("a campaign year whose path-choice deadline has passed still lets the user choose and submit a path", async ({
		page,
	}) => {
		test.slow();
		await withCampaignYear(
			{ page, year: STALE_PATH_CHOICE_YEAR, workforce: 250 },
			async () => {
				await setCompanyWorkforce(200);
				await completeDeclaration(page, { hasGap: true });
				await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 15_000 });

				await expect(page.getByText(READ_ONLY_TAIL)).toHaveCount(0);
				await expect(page.locator("#path-corrective")).toBeEnabled();
				await expect(page.locator("#path-justify")).toBeEnabled();
				await expect(page.locator("#path-joint")).toBeEnabled();

				// The milestone outlives the gate it used to drive: still rendered, still
				// the round the company is in, now purely to nudge.
				await expect(
					page.getByText(
						"Date limite pour choisir un parcours de mise en conformité",
					),
				).toBeVisible();
				await expect(page.getByText(STALE_ROUND1_DEADLINE)).toBeVisible();

				await selectCompliancePath(page, "path-corrective");
				await page.waitForURL(`**${COMPLIANCE_PATH}/etape/1`, {
					timeout: 15_000,
				});
			},
		);
	});
});
