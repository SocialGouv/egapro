import { expect, test } from "@playwright/test";

import { resetGipWorkforce } from "./helpers/db";
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./helpers/dsfr";

// CompanyEditModal.module.scss scopes `.contactLink` to `:global(.fr-link)` purely to
// outrank DSFR's own `.fr-link { color: var(--text-action-high-blue-france) }`, which it
// ties on specificity and would otherwise lose to on source order. CompanyEditModal.test.tsx
// asserts the link's attributes, but jsdom never loads the DSFR stylesheet and so never
// resolves that duel — only a real browser can hold this contract.

const MODAL_ID = "company-edit-modal";

// --text-title-grey → --grey-50-1000 → #161616 in DSFR 1.14's light theme.
const EXPECTED_COLOR = "rgb(22, 22, 22)";
// --text-action-high-blue-france → --blue-france-sun-113-625 → #000091, the colour the
// module override has to beat.
const DSFR_DEFAULT_LINK_COLOR = "rgb(0, 0, 145)";

test.describe("company edit modal — contact link colour", () => {
	test.beforeAll(async () => {
		// The "Modifier" trigger only renders above the CSE threshold, so restore the
		// >= 250 baseline a workforce-mutating spec may have left lowered.
		await resetGipWorkforce();
	});

	test("the contact link overrides the DSFR link colour", async ({ page }) => {
		await page.goto("/mon-espace");

		await waitForDsfrModal(page, MODAL_ID);
		await clickAndExpectDialogOpen(
			page,
			page.locator(`button[aria-controls="${MODAL_ID}"]`),
			MODAL_ID,
		);

		const contactLink = page
			.locator(`#${MODAL_ID}`)
			.getByRole("link", { name: /nous contacter/ });
		await expect(contactLink).toBeVisible();

		const colors = await contactLink.evaluate((element: HTMLAnchorElement) => {
			const probe = element.cloneNode(true) as HTMLElement;
			// Same DSFR classes, minus the hashed CSS-module one: what the link would render
			// as if the override were dropped. Proves DSFR's rule is actually live, so a
			// stylesheet that failed to load cannot make the assertion above pass vacuously.
			probe.className = element.className
				.split(/\s+/)
				.filter((name) => name.startsWith("fr-"))
				.join(" ");
			element.after(probe);
			const withoutOverride = getComputedStyle(probe).color;
			probe.remove();

			return { actual: getComputedStyle(element).color, withoutOverride };
		});

		expect(colors).toEqual({
			actual: EXPECTED_COLOR,
			withoutOverride: DSFR_DEFAULT_LINK_COLOR,
		});
	});
});
