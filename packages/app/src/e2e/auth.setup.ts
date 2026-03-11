import { test as setup } from "@playwright/test";

import { AUTH_FILE } from "./constants";
import { loginWithProConnect } from "./helpers/login";

setup("authenticate via ProConnect", async ({ page }) => {
	setup.setTimeout(60_000);
	await loginWithProConnect(page);
	await page.context().storageState({ path: AUTH_FILE });
});
