import { expect, test } from "@playwright/test";

test.describe("404 Not Found page", () => {
	test("displays the 404 page for non-existent routes", async ({ page }) => {
		const response = await page.goto("/this-route-does-not-exist");

		expect(response?.status()).toBe(404);

		await expect(
			page.getByRole("heading", { name: "Page non trouvée" }),
		).toBeVisible();
		await expect(page.getByText("Erreur 404")).toBeVisible();
	});

	test("provides a link back to the homepage", async ({ page }) => {
		await page.goto("/this-route-does-not-exist");

		const homeLink = page.getByRole("link", { name: "Page d'accueil" });
		await expect(homeLink).toBeVisible();
		await expect(homeLink).toHaveAttribute("href", "/");
	});

	test("displays the error illustration", async ({ page }) => {
		await page.goto("/this-route-does-not-exist");

		const illustration = page.getByRole("img", { includeHidden: true });
		await expect(illustration).toHaveAttribute(
			"src",
			"/assets/images/error/technical-error-illustration.svg",
		);
	});
});
