import { expect, test } from "@playwright/test";

// Page copy / artwork is covered by src/modules/error/__tests__/*.

test.describe("Error pages", () => {
	test("404 — unknown route returns HTTP 404 and renders the Not Found page", async ({
		page,
	}) => {
		const response = await page.goto("/this-route-does-not-exist");

		expect(response?.status()).toBe(404);
		await expect(
			page.getByRole("heading", { name: "Page non trouvée" }),
		).toBeVisible();
	});

	test("500 — a thrown client error is caught by the error boundary", async ({
		page,
	}) => {
		await page.goto("/test-error");
		await page
			.getByRole("button", { name: "Déclencher une erreur client" })
			.click();

		await expect(
			page.getByRole("heading", { name: "Erreur inattendue" }),
		).toBeVisible();
	});

	test("503 — the maintenance route renders the unavailable page", async ({
		page,
	}) => {
		await page.goto("/maintenance");

		await expect(
			page.getByRole("heading", { name: "Service indisponible" }),
		).toBeVisible();
	});
});
