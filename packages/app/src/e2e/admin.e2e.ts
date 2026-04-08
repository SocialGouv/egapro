import { expect, test } from "@playwright/test";

test("non-admin authenticated user visiting /admin is redirected to /mon-espace", async ({
	page,
}) => {
	await page.goto("/admin");
	await page.waitForURL("**/mon-espace");
	expect(page.url()).toContain("/mon-espace");
});
