import { devices, expect, test } from "@playwright/test";

// Run this whole describe in a mobile viewport so the DSFR header collapses
// into the mobile modal.
test.use({ ...devices["Pixel 5"] });

test.describe("Mobile header menu", () => {
	test("shows user info and logout directly inside the mobile modal", async ({
		page,
	}) => {
		await page.goto("/mon-espace");

		// Wait for DSFR JS to attach to the burger button.
		await page.waitForFunction(() =>
			document
				.getElementById("fr-btn-menu-mobile")
				?.hasAttribute("data-fr-js-modal-button"),
		);

		// Open the mobile menu modal via the burger button.
		await page.locator("#fr-btn-menu-mobile").click();

		// Wait for DSFR to mark the modal as opened.
		const modal = page.locator("#modal-menu.fr-modal--opened");
		await expect(modal).toBeVisible();

		// Visual proof under real mobile device emulation.
		await page.screenshot({
			path: "test-results/mobile-menu-opened.png",
			fullPage: false,
		});

		// User info and actions must be visible directly, without having to
		// open any nested dropdown.
		await expect(modal.getByText("test@fia1.fr")).toBeVisible();
		await expect(
			modal.getByRole("link", { name: "Mes entreprises" }),
		).toBeVisible();
		await expect(
			modal.getByRole("button", { name: "Voir mon profil" }),
		).toBeVisible();
		const logoutLink = modal.getByRole("link", { name: "Se déconnecter" });
		await expect(logoutLink).toBeVisible();
		await expect(logoutLink).toHaveAttribute("href", "/api/auth/logout");

		// The desktop dropdown trigger ("Mon espace") must be hidden in the
		// mobile modal — there is only one set of user actions, the inline one.
		await expect(
			modal.getByRole("button", { name: "Mon espace" }),
		).toBeHidden();
	});
});
