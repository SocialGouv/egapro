import { expect, test } from "@playwright/test";

import {
	COMPLIANCE_PATH,
	selectCompliancePath,
} from "./helpers/compliance-flows";
import {
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";

// SecondDeclarationStep1Info.module.scss re-declares `.fr-callout` inside its own scoped
// class to outrank DSFR's rule, and FormActions' `fr-mt-0` cancels the 2rem margin its own
// module sets. SecondDeclarationStep1Info.test.tsx asserts the class names, but jsdom never
// resolves those cascades, never cancels DSFR's callout artwork, and never evaluates the
// `respond-from(md)` padding. Only a real browser holds this contract.

const STEP_1_PATH = `${COMPLIANCE_PATH}/etape/1`;

// --background-alt-blue-france → --blue-france-975-75 in DSFR 1.14's light theme.
const EXPECTED_BACKGROUND = "rgb(245, 245, 254)";
// 1rem / 1.5rem, from the module's `.fr-callout__text` rule.
const EXPECTED_TEXT_FONT_SIZE = "16px";
const EXPECTED_TEXT_LINE_HEIGHT = "24px";
// 2rem, applied from the md breakpoint (48em) upwards only.
const EXPECTED_DESKTOP_PADDING = "32px";

const DESKTOP = { width: 1440, height: 900 };
// Below the md breakpoint the `respond-from(md)` block drops out, so this viewport proves
// the base override still wins the cascade on its own.
const MOBILE = { width: 375, height: 800 };

test.describe("second declaration step 1 — DSFR overrides", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
	});

	test("the callout and form actions keep their overrides on both viewports", async ({
		page,
	}) => {
		test.slow();

		// Step 1 only renders for a declaration that actually reached the corrective-action
		// branch, and the funnel clears a path choice seeded without indicator data behind
		// it — so walk the real parcours instead of forcing the row.
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await page.waitForURL(`**${STEP_1_PATH}`, { timeout: 15_000 });

		const callout = page.locator(".fr-callout");
		const calloutText = page.locator(".fr-callout__text");
		const actions = page.getByRole("link", { name: "Précédent" }).locator("..");

		for (const viewport of [DESKTOP, MOBILE]) {
			await test.step(`viewport ${viewport.width}px`, async () => {
				await page.setViewportSize(viewport);
				await expect(callout).toBeVisible();

				const computed = await callout.evaluate((element) => {
					const { backgroundColor, backgroundImage, marginBottom } =
						getComputedStyle(element);
					return { backgroundColor, backgroundImage, marginBottom };
				});
				expect(computed).toEqual({
					backgroundColor: EXPECTED_BACKGROUND,
					backgroundImage: "none",
					marginBottom: "0px",
				});

				const typography = await calloutText.evaluate((element) => {
					const { fontSize, lineHeight } = getComputedStyle(element);
					return { fontSize, lineHeight };
				});
				expect(typography).toEqual({
					fontSize: EXPECTED_TEXT_FONT_SIZE,
					lineHeight: EXPECTED_TEXT_LINE_HEIGHT,
				});

				await expect(actions).toHaveCSS("margin-top", "0px");
			});
		}

		await test.step("2rem callout padding from the md breakpoint up", async () => {
			await page.setViewportSize(DESKTOP);
			await expect(callout).toHaveCSS("padding", EXPECTED_DESKTOP_PADDING);
		});
	});
});
