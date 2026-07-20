import { test as setup } from "@playwright/test";
import { resetGipWorkforce } from "./helpers/db";
import { AUTH_FILE, loginWithProConnect } from "./helpers/login";

setup("authenticate via ProConnect", async ({ page }) => {
	setup.setTimeout(60_000);
	await loginWithProConnect(page);
	await page.context().storageState({ path: AUTH_FILE });

	// Seeded here rather than in global-setup: app_gip_mds_data references app_company,
	// and the company row only exists once the first ProConnect login has run.
	await resetGipWorkforce();
});
