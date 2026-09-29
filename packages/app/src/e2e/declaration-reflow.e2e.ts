import { expect, type Page, test } from "@playwright/test";
import {
	COMPLIANCE_PATH,
	complianceStepHref,
	remunerationStepHref,
} from "~/modules/routes";
import { selectCompliancePath } from "./helpers/compliance-flows";
import {
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import {
	reachStep6Recap,
	STEP5_CATEGORY_NAME,
	submitFromStep6Recap,
} from "./helpers/declaration-flows";
import { urlGlob, urlPattern } from "./helpers/routes";

const DESKTOP = { width: 1280, height: 720 };
const REFLOW = { width: 320, height: 256 };

async function expectNoHorizontalOverflow(page: Page) {
	await expect
		.poll(() =>
			page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		)
		.toBe(true);
}

test.describe("declaration review recaps at 320px", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
	});

	test("both recaps render their gap cards without horizontal overflow", async ({
		page,
	}) => {
		test.slow();

		await test.step("first declaration recap (étape 6)", async () => {
			await reachStep6Recap(page, { hasGap: true });
			await page.setViewportSize(REFLOW);
			await expect(page).toHaveURL(urlPattern(remunerationStepHref(6)));
			await expect(
				page.getByText("Écart de rémunération", { exact: true }),
			).toBeVisible();
			await expect(
				page.getByText("Écart de rémunération par catégories de salariés", {
					exact: true,
				}),
			).toBeVisible();
			await expect(
				page.getByText(STEP5_CATEGORY_NAME, { exact: true }),
			).toBeVisible();
			await expect(page.getByText("Salaire de base").first()).toBeVisible();
			await expectNoHorizontalOverflow(page);
		});

		await test.step("corrective-action path chosen", async () => {
			await page.setViewportSize(DESKTOP);
			await submitFromStep6Recap(page);
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
			await selectCompliancePath(page, "path-corrective");
			await page.waitForURL(urlGlob(complianceStepHref(1)), {
				timeout: 15_000,
			});
		});

		await test.step("second declaration recap (étape 3)", async () => {
			await page.setViewportSize(REFLOW);
			await page.goto(complianceStepHref(3));
			await expect(page).toHaveURL(urlPattern(complianceStepHref(3)));
			await expect(
				page.getByText(`Catégorie d'emplois n°1 : ${STEP5_CATEGORY_NAME}`),
			).toBeVisible();
			await expect(page.getByText("Salaire de base").first()).toBeVisible();
			await expectNoHorizontalOverflow(page);
		});
	});
});
