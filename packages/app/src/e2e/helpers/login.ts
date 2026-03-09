import type { Page } from "@playwright/test";

/** Dismiss the cookie consent banner if present. */
export async function dismissCookieBanner(page: Page) {
	const refuseButton = page.getByRole("button", { name: "Tout refuser" });
	if (await refuseButton.isVisible({ timeout: 2000 }).catch(() => false)) {
		await refuseButton.click();
	}
}

/** Log in via the local Keycloak identity provider. */
export async function loginWithProConnect(page: Page) {
	await page.goto("/login");
	await dismissCookieBanner(page);
	await page
		.getByRole("button", { name: /s.identifier avec\s*proconnect/i })
		.click();

	// Fill Keycloak login form
	await page.getByLabel("Email").fill("test@fia1.fr");
	await page.locator("#password").fill("test");
	await page.getByRole("button", { name: "Sign In" }).click();

	// Wait for redirect to declaration intro
	await page.waitForURL("**/declaration-remuneration", { timeout: 15_000 });
}
