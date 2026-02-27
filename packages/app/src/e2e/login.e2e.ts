import { expect, test } from "@playwright/test";

import { loginWithProConnect } from "./helpers/login";

test.describe("Login page", () => {
	test("displays ProConnect button and accordion", async ({ page }) => {
		await page.goto("/login");

		await expect(
			page.getByRole("button", { name: /s'identifier avec\s*proconnect/i }),
		).toBeVisible();

		// Accordion with account creation help
		await expect(
			page.getByRole("button", {
				name: /vous n'avez pas de compte/i,
			}),
		).toBeVisible();
	});
});

test.describe("ProConnect authentication flow", () => {
	test("redirects to declaration page after login", async ({ page }) => {
		await loginWithProConnect(page);

		await expect(
			page.getByRole("heading", {
				name: "Déclarer les indicateurs de rémunération",
			}),
		).toBeVisible();
	});

	test("shows user menu in header after login", async ({ page }) => {
		await loginWithProConnect(page);

		// "Mon espace" button should appear instead of "Se connecter"
		await expect(
			page.getByRole("button", { name: "Mon espace" }),
		).toBeVisible();
	});

	test("displays user info in account menu", async ({ page }) => {
		await loginWithProConnect(page);

		// Open user menu
		await page.getByRole("button", { name: "Mon espace" }).click();

		// Verify logout menu item is available (role="menuitem" on the link)
		await expect(
			page.getByRole("menuitem", { name: "Se déconnecter" }),
		).toBeVisible();
	});

	test("logs out and returns to unauthenticated state", async ({ page }) => {
		await loginWithProConnect(page);

		// Open user menu and click logout
		await page.getByRole("button", { name: "Mon espace" }).click();
		await page.getByRole("menuitem", { name: "Se déconnecter" }).click();

		// NextAuth shows a sign-out confirmation page with a CSRF form
		await page.waitForURL("**/api/auth/signout**");
		await page.getByRole("button", { name: /sign out/i }).click();

		// After sign-out, NextAuth redirects to the login page
		await page.waitForURL("**/login", { timeout: 10000 });
		await expect(
			page.getByRole("button", { name: /s'identifier avec\s*proconnect/i }),
		).toBeVisible();
	});

	test("redirects to declaration page when already logged in", async ({
		page,
	}) => {
		await loginWithProConnect(page);

		// Navigate to /login while already authenticated
		await page.goto("/login");

		// Should be redirected to /declaration-remuneration
		await page.waitForURL("**/declaration-remuneration");
		await expect(
			page.getByRole("heading", {
				name: "Déclarer les indicateurs de rémunération",
			}),
		).toBeVisible();
	});
});
