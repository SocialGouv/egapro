import type { Page } from "@playwright/test";

/** Dismiss the cookie consent banner if present. */
export async function dismissCookieBanner(page: Page) {
	const refuseButton = page.getByRole("button", { name: "Tout refuser" });
	if (await refuseButton.isVisible({ timeout: 2000 }).catch(() => false)) {
		await refuseButton.click();
	}
}

/** Log in via ProConnect using the FIA1V2 test identity provider. */
export async function loginWithProConnect(page: Page) {
	await page.goto("/login");
	await dismissCookieBanner(page);
	await page
		.getByRole("button", { name: /s.identifier avec\s*proconnect/i })
		.click();

	// Fill ProConnect login form (external service, may be slow)
	await page.getByLabel("Email").fill("test@fia1.fr", { timeout: 30_000 });
	await page.getByRole("button", { name: /continuer|connexion/i }).click();

	// Handle FIA1V2 identity provider login page
	await page
		.getByRole("button", { name: "Se connecter" })
		.click({ timeout: 15_000 });

	// Wait for redirect to declaration intro
	await page.waitForURL("**/declaration-remuneration", { timeout: 30_000 });
}
