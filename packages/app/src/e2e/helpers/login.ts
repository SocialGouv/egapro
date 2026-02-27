import type { Page } from "@playwright/test";

/** Log in via ProConnect using the FIA1V2 test identity provider. */
export async function loginWithProConnect(page: Page) {
	await page.goto("/login");
	await page
		.getByRole("button", { name: /s'identifier avec\s*proconnect/i })
		.click();

	// Fill ProConnect login form (test@fia1.fr)
	await page.getByLabel("Email").fill("test@fia1.fr");
	await page.getByRole("button", { name: /continuer|connexion/i }).click();

	// Handle FIA1V2 identity provider login page
	await page.getByRole("button", { name: "Se connecter" }).click();

	// Wait for redirect to declaration intro
	await page.waitForURL("**/declaration-remuneration");
}
