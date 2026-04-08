import { expect, test } from "@playwright/test";

test.describe("Desktop header", () => {
	test("does not leak the mobile user block onto the desktop layout", async ({
		page,
	}) => {
		await page.goto("/mon-espace");

		// The desktop "Mon espace" dropdown trigger is visible in the header
		// tools bar.
		await expect(
			page.getByRole("button", { name: "Mon espace" }),
		).toBeVisible();

		// The inline mobile-only actions must NOT bleed into the desktop layout.
		// They are rendered in the DOM (the mobile modal lives in the same tree)
		// but must be hidden via CSS.
		await expect(
			page.getByRole("link", { name: "Mes entreprises" }),
		).toBeHidden();
		await expect(
			page.getByRole("link", { name: "Se déconnecter" }),
		).toBeHidden();
	});
});
