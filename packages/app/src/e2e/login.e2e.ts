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

		// OIDC RP-initiated logout: the browser must be redirected to the IdP's
		// end_session_endpoint to kill the SSO cookie. Verify we land on it
		// (the URL pattern is consistent across charon and direct-upstream setups).
		await page.waitForURL(/session\/end|oauth\/logout/, { timeout: 10_000 });

		// Force-navigate back to egapro. The IdP only auto-redirects to
		// post_logout_redirect_uri if it is registered for the client — which is
		// not necessarily the case in CI. Either way, the local session has been
		// cleared by /api/auth/logout before the IdP redirect, so going home
		// must expose the unauthenticated state.
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
