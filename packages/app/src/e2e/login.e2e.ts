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

	test("hides the public help banner", async ({ page }) => {
		await page.goto("/login");
		await dismissCookieBanner(page);

		await expect(
			page.getByRole("region", { name: /ressources et aide/i }),
		).toHaveCount(0);
	});

	test("illustration column is bounded by fr-container width at wide viewport", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/login");
		await dismissCookieBanner(page);

		const illustrationColumn = page.locator('[aria-hidden="true"]').first();
		const boundingBox = await illustrationColumn.boundingBox();
		const viewportWidth = 1920;
		const maxContainerWidth = 78 * 16;

		expect(boundingBox).not.toBeNull();
		if (boundingBox) {
			expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(
				(viewportWidth + maxContainerWidth) / 2,
			);
		}
	});

	test("illustration stays near top when accordion is expanded", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/login");
		await dismissCookieBanner(page);

		const illustration = page.locator('img[src*="login-illustration"]');
		const initialBox = await illustration.boundingBox();

		const accordion = page.getByRole("button", {
			name: /vous n.avez pas de compte/i,
		});
		if (await accordion.isVisible()) {
			await accordion.click();
			const expandedBox = await illustration.boundingBox();

			expect(initialBox).not.toBeNull();
			expect(expandedBox).not.toBeNull();
			if (initialBox && expandedBox) {
				expect(Math.abs(expandedBox.y - initialBox.y)).toBeLessThan(50);
			}
		}
	});
});

test.describe("ProConnect authentication flow", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("redirects to mon espace after login", async ({ page }) => {
		await loginWithProConnect(page);

		await page.waitForURL("**/mon-espace");
		await expect(
			page.getByRole("button", { name: "Mon espace" }),
		).toBeVisible();

		await expect(page.getByText(/130.?025.?265/).first()).toBeVisible();
	});

	test("logs out and returns to unauthenticated state", async ({ page }) => {
		test.setTimeout(120_000);
		await loginWithProConnect(page);

		await page.getByRole("button", { name: "Mon espace" }).click();
		await page.getByRole("menuitem", { name: "Se déconnecter" }).click();

		await page.waitForURL(/session\/end|oauth\/logout/, { timeout: 10_000 });
		await page.goto("/");

		await expect(
			page.getByRole("link", { name: "Se connecter" }),
		).toBeVisible();
	});

	test("redirects to mon espace when already logged in", async ({ page }) => {
		await loginWithProConnect(page);

		await page.goto("/login");

		await page.waitForURL("**/mon-espace", {
			timeout: 15_000,
		});

		// Verify we are no longer on the login page
		await expect(
			page.getByRole("button", { name: /s.identifier avec\s*proconnect/i }),
		).not.toBeVisible();
	});
});
