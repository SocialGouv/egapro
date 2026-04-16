import { expect, test } from "@playwright/test";

test("admin user can access /admin/liste-referents", async ({ page }) => {
	await page.goto("/admin/liste-referents");
	await expect(
		page.getByRole("heading", { name: "Liste des référents Egapro", level: 1 }),
	).toBeVisible();
});

test("unauthenticated user visiting /admin/liste-referents is redirected to /login", async ({
	browser,
}) => {
	const anonCtx = await browser.newContext({ storageState: undefined });
	try {
		const page = await anonCtx.newPage();
		await page.goto("/admin/liste-referents");
		await page.waitForURL("**/login**");
		expect(page.url()).toContain("/login");
	} finally {
		await anonCtx.close();
	}
});
