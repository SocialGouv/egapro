import { expect, test } from "@playwright/test";

test("non-admin user visiting /admin/liste-referents is redirected to /mon-espace", async ({
	page,
}) => {
	await page.goto("/admin/liste-referents");
	await page.waitForURL("**/mon-espace");
	expect(page.url()).toContain("/mon-espace");
});
