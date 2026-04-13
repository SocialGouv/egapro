import { expect, test } from "@playwright/test";

test("admin user can access /admin/declarations", async ({ page }) => {
	await page.goto("/admin/declarations");
	await page.waitForLoadState("networkidle");
	expect(page.url()).toContain("/admin/declarations");
});

test("unauthenticated user visiting /admin/declarations is redirected to /login", async ({
	browser,
}) => {
	const anonCtx = await browser.newContext({ storageState: undefined });
	try {
		const page = await anonCtx.newPage();
		await page.goto("/admin/declarations");
		await page.waitForURL("**/login**");
		expect(page.url()).toContain("/login");
	} finally {
		await anonCtx.close();
	}
});
