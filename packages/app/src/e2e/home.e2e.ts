import { expect, test } from "@playwright/test";

test("home page redirects authenticated user to mon-espace", async ({
	page,
}) => {
	await page.goto("/");
	await page.waitForURL("**/mon-espace");
	expect(page.url()).toContain("/mon-espace");
});
