import { expect, test } from "@playwright/test";

import { dismissCookieBanner, loginWithProConnect } from "./helpers/login";

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

test.describe("ProConnect authentication flow", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("redirects to declaration page after login", async ({ page }) => {
		await loginWithProConnect(page);

		await page.waitForURL("**/declaration-remuneration/**");
		await expect(
			page.getByRole("button", { name: "Mon espace" }),
		).toBeVisible();

		await expect(page.getByText(/130.?025.?265/)).toBeVisible();
	});

	test("logs out and returns to unauthenticated state", async ({ page }) => {
		await loginWithProConnect(page);

		await page.getByRole("button", { name: "Mon espace" }).click();
		await page.getByRole("menuitem", { name: "Se déconnecter" }).click();

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

		await page.waitForURL("**/declaration-remuneration/**", {
			timeout: 15_000,
		});

		// Verify we are no longer on the login page
		await expect(
			page.getByRole("button", { name: /s.identifier avec\s*proconnect/i }),
		).not.toBeVisible();
	});
});
