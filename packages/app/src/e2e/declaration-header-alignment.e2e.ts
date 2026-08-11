import { expect, test } from "@playwright/test";
import {
	pushCampaignDeadlinesFarFuture,
	resetDeclarationToDraft,
	setDeclarationComplianceState,
	setWorkforceCounts,
} from "./helpers/db";

// #3579. Every declaration header pairs a growing <h1> with a fixed-height
// companion — the "Enregistré" indicator, or the recap's download button. The
// row used to centre that companion on the *whole* title box
// (`fr-grid-row--middle`, and `align-items: center` on `.flexBetween`), so the
// moment the title wrapped it slid down to the middle of two lines instead of
// staying on the first one. Both were flipped to a top alignment.
//
// jsdom cannot hold this contract: the component tests see the class string,
// never the line boxes it has to align, and the SCSS module is mocked away
// there. Only a real browser lays the title out and decides where it wraps.

// The width the ticket's capture was taken at. Every screen below wraps its
// title here — funnel step 1 included even once the dev-only "[DEV] Remplir"
// button is discounted, so the contract survives a build that drops it.
const VIEWPORT = { width: 1006, height: 900 };

// The fix leaves the companion 2px above the first line's centre (4px below on
// the recap, whose taller button carries its own metrics). Centring it on a
// two-line title instead drops it 16px. 8px sits clear of both states.
const MAX_CENTER_OFFSET = 8;

type Screen = {
	name: string;
	path: string;
	companion: string;
	setup: () => Promise<void>;
};

const SCREENS: Screen[] = [
	{
		name: "funnel step 1",
		path: "/declaration-remuneration/etape/1",
		companion: "p[role='status']",
		// The indicator only renders once the step holds data.
		setup: async () => {
			await resetDeclarationToDraft();
			await setWorkforceCounts(75, 80);
		},
	},
	{
		name: "funnel step 6 review",
		path: "/declaration-remuneration/etape/6",
		companion: "p[role='status']",
		setup: async () => {
			await resetDeclarationToDraft();
			await setDeclarationComplianceState({ status: "draft", currentStep: 6 });
		},
	},
	{
		name: "récapitulatif",
		path: "/declaration-remuneration/recapitulatif",
		companion: "a[download]",
		setup: async () => {
			await setDeclarationComplianceState({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
			});
		},
	},
	{
		// The `.flexBetween` half of the fix: no `fr-grid-row` screen exercises the
		// SCSS rule. This header is also the one whose title is long enough to wrap
		// at every desktop width, so it holds the contract whatever the breakpoint.
		name: "second declaration step 1",
		path: "/declaration-remuneration/parcours-conformite/etape/1",
		companion: "p[role='status']",
		setup: async () => {
			await setDeclarationComplianceState({
				status: "corrective_actions_chosen",
				firstDeclarationPathChoice: "corrective_action",
				currentStep: 6,
			});
		},
	},
];

test.describe("declaration header alignment", () => {
	// Serial: every screen below reconfigures the one declaration record the
	// suite shares, so these cannot interleave with one another.
	test.describe.configure({ mode: "serial" });
	test.use({ viewport: VIEWPORT });

	// Re-asserted rather than inherited from globalSetup: the deadline specs run
	// earlier in the alphabet and leave the campaign closed, which bounces the
	// funnel out before any header renders.
	test.beforeAll(async () => {
		await pushCampaignDeadlinesFarFuture();
	});

	for (const screen of SCREENS) {
		test(`${screen.name} — the companion stays on the title's first line`, async ({
			page,
		}) => {
			await screen.setup();
			await page.goto(screen.path);

			const heading = page.getByRole("main").getByRole("heading", { level: 1 });
			await expect(heading).toBeVisible();

			const measurement = await heading.evaluate((h1, companionSelector) => {
				// Scoped to the header itself: an unrelated `p[role="status"]` sits
				// further down some of these pages and a document-wide lookup wins it.
				const column = h1.parentElement;
				if (!column) throw new Error("Heading has no parent");
				const row = column.classList.contains("fr-col")
					? column.parentElement
					: column;
				const companion = row?.querySelector(companionSelector);
				if (!companion) {
					throw new Error(`No ${companionSelector} in the header row`);
				}

				// Line boxes, not the heading's bounding box: that one spans every
				// line, so its centre reads the same before and after the fix.
				const range = document.createRange();
				range.selectNodeContents(h1);
				const lines: { bottom: number; top: number }[] = [];
				for (const rect of Array.from(range.getClientRects())) {
					if (rect.width === 0 || rect.height === 0) continue;
					const line = lines.find((l) => Math.abs(l.top - rect.top) < 4);
					if (line) line.bottom = Math.max(line.bottom, rect.bottom);
					else lines.push({ bottom: rect.bottom, top: rect.top });
				}
				lines.sort((a, b) => a.top - b.top);
				const firstLine = lines[0];
				if (!firstLine) throw new Error("Heading has no line box");

				const box = companion.getBoundingClientRect();
				return {
					lineCount: lines.length,
					offset: Math.round(
						(box.top + box.bottom) / 2 - (firstLine.top + firstLine.bottom) / 2,
					),
				};
			}, screen.companion);

			// Asserted first: a shorter title would fit on one line and make the
			// offset below pass without proving anything about the alignment.
			expect(measurement.lineCount).toBeGreaterThan(1);
			expect(Math.abs(measurement.offset)).toBeLessThanOrEqual(
				MAX_CENTER_OFFSET,
			);
		});
	}
});
