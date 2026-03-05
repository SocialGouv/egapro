import { expect, test } from "@playwright/test";

test.describe("404 Not Found page", () => {
	test("displays the 404 page for non-existent routes", async ({ page }) => {
		const response = await page.goto("/this-route-does-not-exist");

		expect(response?.status()).toBe(404);

		await expect(
			page.getByText("la page que vous cherchez n'existe pas"),
		).toBeVisible();
	});
});
