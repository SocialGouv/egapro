import { expect, test } from "@playwright/test";
import {
	COMPLIANCE_PATH,
	selectCompliancePath,
} from "./helpers/compliance-flows";
import {
	countPathChoiceEventsRound1,
	lastPathChoiceValueRound1,
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";

test.describe.configure({ mode: "serial" });

test.describe("[ANX-01] Path change before downstream action — tâtonnement supported", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("user explores corrective_action then switches to joint_evaluation: both events persisted, latest wins", async ({
		page,
	}) => {
		await completeDeclaration(page, { hasGap: true });
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });

		await selectCompliancePath(page, "path-corrective");
		await page.waitForURL(`**${COMPLIANCE_PATH}/etape/1`, { timeout: 10_000 });

		expect(await countPathChoiceEventsRound1()).toBe(1);
		expect(await lastPathChoiceValueRound1()).toBe("corrective_action");

		await selectCompliancePath(page, "path-joint");
		await page.waitForURL("**/evaluation-conjointe", { timeout: 10_000 });

		expect(await countPathChoiceEventsRound1()).toBe(2);
		expect(await lastPathChoiceValueRound1()).toBe("joint_evaluation");
	});
});
