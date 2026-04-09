import { expect, test } from "@playwright/test";

test("non-admin user visiting /admin/declarations is redirected to /mon-espace", async ({
	page,
}) => {
	await page.goto("/admin/declarations");
	await page.waitForURL("**/mon-espace");
	expect(page.url()).toContain("/mon-espace");
});

test("non-admin user visiting /admin/declarations/:id is redirected to /mon-espace", async ({
	page,
}) => {
	await page.goto("/admin/declarations/00000000-0000-0000-0000-000000000000");
	await page.waitForURL("**/mon-espace");
	expect(page.url()).toContain("/mon-espace");
});
