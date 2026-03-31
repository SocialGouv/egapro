import type { Page } from "@playwright/test";

export const AUTH_FILE = "test-results/.auth/user.json";

/** Dismiss the cookie consent banner if present. */
export async function dismissCookieBanner(page: Page) {
	const refuseButton = page.getByRole("button", { name: "Tout refuser" });
	if (await refuseButton.isVisible({ timeout: 2000 }).catch(() => false)) {
		await refuseButton.click();
	}
}

/** Log in via ProConnect using the FIA1V2 test identity provider. */
export async function loginWithProConnect(page: Page, retries = 2) {
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			await page.goto("/login");
			await dismissCookieBanner(page);

			await page
				.getByRole("button", { name: /s.identifier avec\s*proconnect/i })
				.click();

			// ProConnect FIA1V2 flow
			await page.getByLabel("Email").fill("test@fia1.fr");
			await page.getByRole("button", { name: /continuer|connexion/i }).click();
			await page.getByRole("button", { name: "Se connecter" }).click();

			// Wait for redirect to mon espace (slow ProConnect in CI)
			await page.waitForURL("**/mon-espace", { timeout: 30_000 });
			return;
		} catch (error) {
			if (attempt === retries) throw error;
			await page.context().clearCookies();
		}
	}
}
