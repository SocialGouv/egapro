import { expect, test } from "@playwright/test";

import { COMPLIANCE_PATH } from "./helpers/compliance-flows";
import {
	ensureCurrentYearDeclaration,
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setDeclarationComplianceState,
} from "./helpers/db";

// Figma node 7548-74759 lays the content column out as a 32px-gap flex column in
// which the step indicator is a block like any other — 32px above it, 32px below.
const RHYTHM = 32;

// Rendered gaps, not computed margins: the hosts reach 32px by three different
// mechanisms (a flex `gap` with the stepper's own margins stripped, in two
// separate stylesheets, and plain block-flow margins), so the gap is the only
// value common to all of them. It is also what actually regressed in #3578 —
// `fr-mb-3w`'s `!important` 24px *added* to a 32px flex gap gave 56px, and a
// heading carrying `fr-mb-3w` instead of `fr-mb-4w` gave 24px. jsdom resolves
// neither flex `gap` nor the DSFR cascade, so no unit test can hold this
// contract; asserting the class string only restates the fix.
type Screen = {
	name: string;
	path: string;
	// Left unset where the preceding block is a `fr-grid-row--gutters`, whose
	// negative margin makes its border box overhang its content — the same 32px
	// rhythm then measures 20px at desktop and 24px below md, tracking DSFR's own
	// breakpoint rather than anything this contract owns.
	checksAbove?: true;
};

const CORRECTED: Screen[] = [
	{
		name: "seconde déclaration — étape 1",
		path: `${COMPLIANCE_PATH}/etape/1`,
		checksAbove: true,
	},
	{ name: "seconde déclaration — étape 2", path: `${COMPLIANCE_PATH}/etape/2` },
	{
		name: "seconde déclaration — étape 3",
		path: `${COMPLIANCE_PATH}/etape/3`,
		checksAbove: true,
	},
	// The only one of the four fixed on the gap *above* the stepper, so its
	// `checksAbove` is the assertion that pins the actual correction.
	{ name: "avis CSE — étape 1", path: "/avis-cse/etape/1", checksAbove: true },
];

// Screens that were already at 32px and must stay there. The declaration funnel
// earns its place: its stepper is a *grandchild* of `.flexColumnGap2`, so the
// `> :global(.fr-stepper)` rule added for #3578 deliberately misses it and its
// 32px comes solely from StepIndicator.module.scss. Widening that selector to a
// descendant combinator would zero those margins — and because the funnel's flex
// `gap` is inert (single `<fieldset>` child), the rhythm would collapse to 0
// rather than degrade. Step 5 covers the shared `.form` host from the other side.
const WITNESSES: Screen[] = [
	{ name: "déclaration — étape 1", path: "/declaration-remuneration/etape/1" },
	{ name: "déclaration — étape 5", path: "/declaration-remuneration/etape/5" },
	{ name: "avis CSE — étape 2", path: "/avis-cse/etape/2", checksAbove: true },
];

// One viewport is enough, and measurably so: every gap asserted here reads the
// same at 1440px and at 375px. Neither `.flexColumnGap2`'s gap, the stepper
// margin resets, nor the DSFR `.fr-stepper` default carries a media query, and
// the one value that does move with the breakpoint is the gutters overhang this
// contract deliberately leaves unasserted.
test.describe("stepper vertical rhythm", () => {
	test.beforeAll(async () => {
		await ensureCurrentYearDeclaration();
		await resetDeclarationToDraft();
		await resetGipWorkforce();
		await setCompanyHasCse(true);
		// SecondDeclarationStepPage gates its three steps on this single choice and
		// redirects to the compliance path without it. Seeding it reaches all four
		// corrected screens by URL instead of replaying the funnel that produces it.
		await setDeclarationComplianceState({
			firstDeclarationPathChoice: "corrective_action",
		});
	});

	for (const screen of [...CORRECTED, ...WITNESSES]) {
		test(`${screen.name} — 32px between the stepper and the content`, async ({
			page,
		}) => {
			await page.goto(screen.path);

			const stepper = page.locator(".fr-stepper").first();
			await expect(stepper).toBeVisible();

			const measured = await stepper.evaluate((element) => {
				const previous = element.previousElementSibling;
				const next = element.nextElementSibling;
				if (!previous || !next) {
					throw new Error("the stepper must be framed by two sibling blocks");
				}
				const box = element.getBoundingClientRect();
				return {
					above: Math.round(box.top - previous.getBoundingClientRect().bottom),
					below: Math.round(next.getBoundingClientRect().top - box.bottom),
				};
			});

			if (screen.checksAbove) {
				expect(measured).toEqual({ above: RHYTHM, below: RHYTHM });
			} else {
				expect(measured.below).toBe(RHYTHM);
			}
		});
	}
});
