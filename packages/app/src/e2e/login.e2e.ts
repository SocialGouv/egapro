import { expect, test } from "@playwright/test";

import { dismissCookieBanner } from "./helpers/login";

test.describe("Login page", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("displays ProConnect button", async ({ page }) => {
		await page.goto("/login");
		await dismissCookieBanner(page);

		await expect(
			page.getByRole("button", { name: /s.identifier avec\s*proconnect/i }),
		).toBeVisible();
	});
});

test.describe("Authenticated user features", () => {
	test("redirects to declaration page after login", async ({ page }) => {
		await page.goto("/declaration-remuneration");

		await page.waitForURL("**/declaration-remuneration/**");
		await expect(
			page.getByRole("button", { name: "Mon espace" }),
		).toBeVisible();

		await expect(page.getByText(/130.?025.?265/)).toBeVisible();
	});

	test("shows user menu in header after login", async ({ page }) => {
		await page.goto("/declaration-remuneration");

		await expect(
			page.getByRole("button", { name: "Mon espace" }),
		).toBeVisible();
	});

	test("displays user info in account menu", async ({ page }) => {
		await page.goto("/declaration-remuneration");

		await page.getByRole("button", { name: "Mon espace" }).click();

		await expect(
			page.getByRole("menuitem", { name: "Se déconnecter" }),
		).toBeVisible();
	});

	test("redirects to declaration page when already logged in", async ({
		page,
	}) => {
		await page.goto("/login");

		// Double redirect: /login → /declaration-remuneration → /declaration-remuneration/etape/1
		await page.waitForURL("**/declaration-remuneration/etape/**", {
			timeout: 15_000,
		});
		await expect(
			page.getByRole("heading", {
				name: /Déclarer les indicateurs pour l'ensemble/i,
			}),
		).toBeVisible();
	});
});
