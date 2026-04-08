import { devices, expect, test } from "@playwright/test";

// Run this whole describe in a mobile viewport so the DSFR header collapses
// into the mobile modal.
test.use({ ...devices["Pixel 5"] });

test.describe("Mobile header menu", () => {
	test("opens the user account menu inside the mobile modal", async ({
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

		// Click "Mon espace" inside the modal to open the dropdown.
		await modal.getByRole("button", { name: "Mon espace" }).click();

		// Dropdown content must be reachable inside the modal.
		await expect(modal.getByText("test@fia1.fr")).toBeVisible();
		await expect(
			modal.getByRole("menuitem", { name: "Mes entreprises" }),
		).toBeVisible();
		await expect(
			modal.getByRole("menuitem", { name: "Voir mon profil" }),
		).toBeVisible();
		const logoutLink = modal.getByRole("menuitem", { name: "Se déconnecter" });
		await expect(logoutLink).toBeVisible();
		await expect(logoutLink).toHaveAttribute("href", "/api/auth/logout");
	});
});
