import { writeFile } from "node:fs/promises";
import { test as setup } from "@playwright/test";
import { TEST_USER_EMAIL_FILE, TEST_USER_PHONE } from "./constants";
import {
	resetGipWorkforce,
	setCompanyHasCse,
	setUserPhone,
} from "./helpers/db";
import { AUTH_FILE, loginWithProConnect } from "./helpers/login";

setup("authenticate via ProConnect", async ({ page }) => {
	setup.setTimeout(180_000);
	await loginWithProConnect(page);
	await page.context().storageState({ path: AUTH_FILE });
	const response = await page.request.get("/api/auth/session");
	const session = (await response.json()) as {
		user?: { email?: unknown; isAdmin?: unknown };
	};
	if (typeof session.user?.email !== "string" || !session.user.email) {
		throw new Error("ProConnect did not return an email for the test user");
	}
	if (session.user.isAdmin !== true) {
		throw new Error("ProConnect test user did not receive admin access");
	}
	await writeFile(TEST_USER_EMAIL_FILE, session.user.email);

	// Seeded here rather than in global-setup: app_gip_mds_data and app_user_company
	// reference app_company, and the company row only exists once the first ProConnect
	// login has run.
	await resetGipWorkforce();

	// Declaration prerequisites (#3952): the funnel layout bounces to /mon-espace until
	// the phone and — above the CSE threshold, which the >= 250 baseline always crosses —
	// the CSE answer are known. A ProConnect sign-up carries neither, so without this
	// baseline every spec entering the funnel would silently depend on which earlier
	// spec file happened to fill them in.
	await setUserPhone(TEST_USER_PHONE);
	await setCompanyHasCse(true);
});
