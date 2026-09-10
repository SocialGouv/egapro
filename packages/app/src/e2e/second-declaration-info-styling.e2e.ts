import { expect, test } from "@playwright/test";
import { complianceStepHref } from "~/modules/routes";
import { selectCompliancePath } from "./helpers/compliance-flows";
import {
	ensureCurrentYearDeclaration,
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setCompanyWorkforce,
	setDeclarationComplianceState,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";

// SecondDeclarationStep1Info.module.scss re-declares `.fr-callout` inside its own scoped
// class to outrank DSFR's rule, and FormActions' `fr-mt-0` cancels the 2rem margin its own
// module sets. SecondDeclarationStep1Info.test.tsx asserts the class names, but jsdom never
// resolves those cascades, never cancels DSFR's callout artwork, and never evaluates the
// `respond-from(md)` padding. Only a real browser holds this contract.

const STEP_1_PATH = complianceStepHref(1);

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

// #4141 — FormActions owns the 32px above the buttons as `margin-top: 2rem`, which is right
// under a block-flow parent and wrong under these `gap: 2rem` flex columns, where it adds to
// the gap instead of collapsing into it: 64px on étape 3 until `fr-mt-0` cancelled it.
// `CompliancePathChoice` reached the same 32px through a positional `> :last-child` rule
// until #4141 swapped it for that shared idiom — a substitution no unit test can observe,
// since jsdom resolves neither the flex gap nor DSFR's `!important` reset, and the vitest
// tests assert the class string rather than what it renders to.
const FLEX_HOSTS = [
	{ name: "choix du parcours", path: COMPLIANCE_PATH },
	{ name: "seconde déclaration — étape 3", path: `${COMPLIANCE_PATH}/etape/3` },
];

// The rendered gap, not the computed margin: 32px is what the maquette asks for and what
// regressed to 64px, whereas asserting `margin-top: 0` only restates the class name.
const EXPECTED_ACTIONS_GAP = 32;

test.describe("form actions — 32px under a flex-gap parent", () => {
	// Both screens gate on the corrective branch and redirect out without it. Seeding the
	// choice reaches them by URL, where replaying the funnel lands on étape 1 only and leaves
	// étape 3 — the screen the bug was on — unreachable. Same recipe as stepper-spacing.
	test.beforeAll(async () => {
		await ensureCurrentYearDeclaration();
		await resetDeclarationToDraft();
		await resetGipWorkforce();
		await setCompanyHasCse(true);
		await setDeclarationComplianceState({
			firstDeclarationPathChoice: "corrective_action",
		});
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
	});

	for (const host of FLEX_HOSTS) {
		test(`${host.name} — 32px between the last block and the form actions`, async ({
			page,
		}) => {
			await page.goto(host.path);
			// A redirected page still has a "Précédent" link to measure, so pin the URL:
			// without it a green run proves nothing about the screen named here.
			await page.waitForURL(`**${host.path}`, { timeout: 15_000 });

			const actions = page
				.getByRole("link", { name: "Précédent" })
				.locator("..");
			await expect(actions).toBeVisible();

			const gap = await actions.evaluate((element) => {
				// Étape 3 keeps its submit modal in the DOM while closed, immediately before
				// the actions. It is `position: fixed` and fills the viewport, so its border
				// box says nothing about the flow the 32px belongs to: walk back to the
				// nearest sibling actually laid out in that flow.
				let previous = element.previousElementSibling;
				while (previous && getComputedStyle(previous).position === "fixed") {
					previous = previous.previousElementSibling;
				}
				if (!previous) {
					throw new Error("the form actions must follow a content block");
				}
				return Math.round(
					element.getBoundingClientRect().top -
						previous.getBoundingClientRect().bottom,
				);
			});

			expect(gap).toBe(EXPECTED_ACTIONS_GAP);
		});
	}
});
