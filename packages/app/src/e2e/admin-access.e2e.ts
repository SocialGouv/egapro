import { expect, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import {
	ADMIN,
	ADMIN_DECLARATIONS,
	ADMIN_IMPERSONATE,
	ADMIN_REFERENTS,
	ADMIN_SETTINGS,
	LOGIN,
} from "~/modules/routes";

// Merged from the former admin / admin-declarations / admin-referents specs.

test.describe("admin access", () => {
	// One test per route so a failure pinpoints the broken route; they all reuse
	// the shared auth state (no per-test login) inside this describe.
	test("admin can reach /admin (backoffice)", async ({ page }) => {
		await page.goto(ADMIN);
		await expect(
			page.getByRole("heading", { name: "Backoffice", level: 1 }),
		).toBeVisible();
		await expect(page.getByText("administrateur")).toBeVisible();
	});

	test("admin can reach /admin/impersonate", async ({ page }) => {
		await page.goto(ADMIN_IMPERSONATE);
		await expect(
			page.getByRole("heading", { name: "Mimoquer une entreprise", level: 1 }),
		).toBeVisible();
	});

	test("admin can reach /admin/parametres", async ({ page }) => {
		await page.goto(ADMIN_SETTINGS);
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
	});

	test("admin can reach /admin/liste-referents", async ({ page }) => {
		await page.goto(ADMIN_REFERENTS);
		await expect(
			page.getByRole("heading", {
				name: "Liste des référents Egapro",
				level: 1,
			}),
		).toBeVisible();
	});

	test("admin can reach /admin/declarations", async ({ page }) => {
		await page.goto(ADMIN_DECLARATIONS);
		await page.waitForLoadState("networkidle");
		expect(page.url()).toContain(ADMIN_DECLARATIONS);
	});

	test("admin routes hide the public footer and help banner", async ({
		page,
	}) => {
		// Authenticated chromium project: /admin reaches the real backoffice, not a login-redirect fallback.
		await page.goto(ADMIN);
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
			await page.goto(ADMIN_DECLARATIONS);
			await page.waitForURL(urlGlob(`${LOGIN}**`));
			expect(page.url()).toContain(LOGIN);
		} finally {
			await anonCtx.close();
		}
	});
});
