import { expect, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import { HOME, MY_SPACE } from "~/modules/routes";

test("home page redirects authenticated user to mon-espace", async ({
	page,
}) => {
	await page.goto(HOME);
	await page.waitForURL(urlGlob(MY_SPACE));
	expect(page.url()).toContain(MY_SPACE);
});
