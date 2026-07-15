import { expect, test } from "@playwright/test";

// Consolidated admin access + auth-guard checks (previously split across
// admin.e2e.ts, admin-declarations.e2e.ts and admin-referents.e2e.ts). The
// pixel-layout assertion (fluid container / sidemenu width) was dropped — it is
// not reproducible in jsdom and only pinned DSFR layout CSS.

test.describe("admin access", () => {
	test("admin can reach the backoffice routes", async ({ page }) => {
		await page.goto("/admin");
		await expect(
			page.getByRole("heading", { name: "Backoffice", level: 1 }),
		).toBeVisible();
		await expect(page.getByText("administrateur")).toBeVisible();

		await page.goto("/admin/impersonate");
		await expect(
			page.getByRole("heading", { name: "Mimoquer une entreprise", level: 1 }),
		).toBeVisible();

		await page.goto("/admin/parametres");
		await expect(
			page.getByRole("heading", {
				name: "Paramètres de la plateforme",
				level: 1,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Échéances de campagne", level: 2 }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Année de campagne active", level: 2 }),
		).not.toBeVisible();

		await page.goto("/admin/liste-referents");
		await expect(
			page.getByRole("heading", {
				name: "Liste des référents Egapro",
				level: 1,
			}),
		).toBeVisible();

		await page.goto("/admin/declarations");
		await page.waitForLoadState("networkidle");
		expect(page.url()).toContain("/admin/declarations");
	});

	test("admin routes hide the public footer and help banner", async ({
		page,
	}) => {
		// Runs in the authenticated `chromium` project (see playwright.config.ts):
		// `page.goto("/admin")` reaches the real backoffice, so this exercises the
		// PublicChrome branch, not a login-redirect fallback that trivially passes.
		await page.goto("/admin");
		await expect(
			page.getByRole("heading", { name: "Backoffice", level: 1 }),
		).toBeVisible();
		await expect(page.locator("footer#footer")).toHaveCount(0);
		await expect(
			page.getByRole("region", { name: "Ressources et aide" }),
		).toHaveCount(0);
	});

	test("unauthenticated user is redirected to /login", async ({ browser }) => {
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
});
