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

	test("displays the DSFR error artwork", async ({ page }) => {
		await page.goto("/this-route-does-not-exist");

		const artwork = page.locator("svg.fr-artwork");
		await expect(artwork).toBeVisible();
		await expect(artwork).toHaveAttribute("aria-hidden", "true");
	});
});

test.describe("500 Internal Server Error page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/test-error");
		await page
			.getByRole("button", { name: "Déclencher une erreur 500" })
			.click();
	});

	test("displays the 500 page when an error is thrown", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: "Erreur inattendue" }),
		).toBeVisible();
		await expect(page.getByText("Erreur 500")).toBeVisible();
	});

	test("displays the apology and retry guidance", async ({ page }) => {
		await expect(
			page.getByText(/le service rencontre un problème/),
		).toBeVisible();
		await expect(
			page.getByText(/rafraîchir la page ou bien réessayez plus tard/),
		).toBeVisible();
	});

	test("displays the DSFR error artwork", async ({ page }) => {
		const artwork = page.locator("svg.fr-artwork");
		await expect(artwork).toBeVisible();
		await expect(artwork).toHaveAttribute("aria-hidden", "true");
	});
});

test.describe("503 Service Unavailable page", () => {
	test("displays the 503 maintenance page", async ({ page }) => {
		await page.goto("/maintenance");

		await expect(
			page.getByRole("heading", { name: "Service indisponible" }),
		).toBeVisible();
		await expect(page.getByText("Erreur 503")).toBeVisible();
	});

	test("displays the unavailability explanation and retry guidance", async ({
		page,
	}) => {
		await page.goto("/maintenance");

		await expect(
			page.getByText(/le service est temporairement inaccessible/),
		).toBeVisible();
		await expect(page.getByText(/Merci de réessayer plus tard/)).toBeVisible();
	});

	test("displays the DSFR error artwork", async ({ page }) => {
		await page.goto("/maintenance");

		const artwork = page.locator("svg.fr-artwork");
		await expect(artwork).toBeVisible();
		await expect(artwork).toHaveAttribute("aria-hidden", "true");
	});
});
