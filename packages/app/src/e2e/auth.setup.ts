import path from "node:path";
import { test as setup } from "@playwright/test";

import { loginWithProConnect } from "./helpers/login";

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json");

setup("authenticate via ProConnect", async ({ page }) => {
	setup.setTimeout(60_000);
	await loginWithProConnect(page);
	await page.context().storageState({ path: AUTH_FILE });
});
