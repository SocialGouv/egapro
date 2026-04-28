import { expect, test } from "@playwright/test";

import { loginWithProConnect } from "./helpers/login";

test.describe("Logout flow", () => {
	test("logs out and returns to unauthenticated state", async ({ page }) => {
		test.setTimeout(60_000);
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
});
