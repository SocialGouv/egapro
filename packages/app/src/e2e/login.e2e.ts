import { expect, test } from "@playwright/test";

import { dismissCookieBanner, loginWithProConnect } from "./helpers/login";

test.describe("Login page", () => {
	test("displays ProConnect button", async ({ page }) => {
		await page.goto("/login");
		await dismissCookieBanner(page);

		await expect(
			page.getByRole("button", { name: /s.identifier avec\s*proconnect/i }),
		).toBeVisible();
	});
});

test.describe("ProConnect authentication flow", () => {
	test("redirects to declaration page after login", async ({ page }) => {
		await loginWithProConnect(page);

		await page.waitForURL("**/declaration-remuneration");
		await expect(
			page.getByRole("button", { name: "Mon espace" }).first(),
		).toBeVisible();

		await expect(page.getByText(/130 025 265/)).toBeVisible();
	});

	test("shows user menu in header after login", async ({ page }) => {
		await loginWithProConnect(page);

		await expect(
			page.getByRole("button", { name: "Mon espace" }).first(),
		).toBeVisible();
	});

	test("displays user info in account menu", async ({ page }) => {
		await loginWithProConnect(page);

		await page.getByRole("button", { name: "Mon espace" }).first().click();

		await expect(
			page.getByRole("menuitem", { name: "Se déconnecter" }),
		).toBeVisible();
	});

	test("logs out and returns to unauthenticated state", async ({ page }) => {
		await loginWithProConnect(page);

		await page.getByRole("button", { name: "Mon espace" }).first().click();
		await page.getByRole("menuitem", { name: "Se déconnecter" }).click();

		await page.waitForURL("**/api/auth/signout**");
		await page.getByRole("button", { name: /sign out/i }).click();

		await page.waitForURL("**/login", { timeout: 10000 });
		await expect(
			page.getByRole("button", { name: /s.identifier avec\s*proconnect/i }),
		).toBeVisible();
	});

	test("redirects to declaration page when already logged in", async ({
		page,
	}) => {
		await loginWithProConnect(page);

		await page.goto("/login");

		await page.waitForURL("**/declaration-remuneration", { timeout: 10_000 });
		await expect(
			page.getByRole("heading", {
				name: "Déclarer les indicateurs de rémunération",
			}),
		).toBeVisible();
	});
});
