import type { Page } from "@playwright/test";
import { LOGIN, MY_SPACE } from "~/modules/routes";
import { TEST_LOGIN_EMAIL, TEST_SIREN } from "../constants";
import { urlGlob } from "./routes";

export const AUTH_FILE = "test-results/.auth/user.json";

/** Dismiss the cookie consent banner if present. */
export async function dismissCookieBanner(page: Page) {
	const refuseButton = page.getByRole("button", { name: "Tout refuser" });
	if (await refuseButton.isVisible({ timeout: 2000 }).catch(() => false)) {
		await refuseButton.click();
	}
}

/** Log in via ProConnect using the FIA1V2 test identity provider. */
export async function loginWithProConnect(page: Page, retries = 4) {
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			await page.goto(LOGIN);
			await dismissCookieBanner(page);

			await page
				.getByRole("button", { name: /s.identifier avec\s*proconnect/i })
				.click();

			// Route to the test identity provider, then provide a stable identity.
			await page.getByLabel("Email").fill("egapro-e2e@test.proconnect.gouv.fr");
			await page.getByRole("button", { name: /continuer|connexion/i }).click();
			await page.getByLabel("email", { exact: true }).fill(TEST_LOGIN_EMAIL);
			await page
				.getByLabel("sub", { exact: true })
				.fill("egapro-e2e-130025265");
			await page.locator("#open-custom-configuration").click();
			await page
				.getByLabel("siret", { exact: true })
				.fill(`${TEST_SIREN}00013`);
			await page.getByRole("button", { name: "Se connecter" }).click();

			// Wait for redirect to mon espace (slow ProConnect in CI)
			await page.waitForURL(urlGlob(MY_SPACE), { timeout: 30_000 });
			const response = await page.request.get("/api/auth/session");
			const session = (await response.json()) as {
				user?: { email?: string; siret?: string };
			};
			if (
				session.user?.email?.toLowerCase() !== TEST_LOGIN_EMAIL ||
				!session.user?.siret?.startsWith(TEST_SIREN)
			) {
				throw new Error(
					`ProConnect returned a different test identity (${session.user?.email ?? "missing email"}, ${session.user?.siret ?? "missing SIRET"})`,
				);
			}
			return;
		} catch (error) {
			if (attempt === retries || page.isClosed()) throw error;
			await page.context().clearCookies();
		}
	}
}
