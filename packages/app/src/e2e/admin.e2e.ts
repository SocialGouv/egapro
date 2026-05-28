import { expect, test } from "@playwright/test";

test("admin user can access /admin and sees backoffice page", async ({
	page,
}) => {
	await page.goto("/admin");
	await expect(
		page.getByRole("heading", { name: "Backoffice", level: 1 }),
	).toBeVisible();
	await expect(page.getByText("administrateur")).toBeVisible();
});

test("admin routes hide the public footer and help banner", async ({
	page,
}) => {
	// Runs in the authenticated `chromium` Playwright project (see
	// playwright.config.ts): `page.goto("/admin")` reaches the real backoffice
	// page, so the assertions below exercise the PublicChrome branch, not a
	// login-redirect fallback that would trivially pass.
	await page.goto("/admin");
	await expect(
		page.getByRole("heading", { name: "Backoffice", level: 1 }),
	).toBeVisible();
	await expect(page.locator("footer#footer")).toHaveCount(0);
	await expect(
		page.getByRole("region", { name: "Ressources et aide" }),
	).toHaveCount(0);
});

test("admin user can access /admin/impersonate and sees impersonate page", async ({
	page,
}) => {
	await page.goto("/admin/impersonate");
	await expect(
		page.getByRole("heading", { name: "Mimoquer une entreprise", level: 1 }),
	).toBeVisible();
});

test("admin user can access /admin/parametres and sees settings page", async ({
	page,
}) => {
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
});

test("admin layout uses fluid container with fixed-width sidemenu on desktop", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/admin");
	await expect(
		page.getByRole("heading", { name: "Backoffice", level: 1 }),
	).toBeVisible();

	const nav = page.locator("nav.fr-sidemenu");
	const navBox = await nav.boundingBox();
	expect(navBox).not.toBeNull();
	if (navBox) {
		expect(navBox.width).toBeGreaterThanOrEqual(260);
		expect(navBox.width).toBeLessThanOrEqual(300);
	}

	const heading = page.getByRole("heading", { name: "Backoffice", level: 1 });
	const headingBox = await heading.boundingBox();
	expect(headingBox).not.toBeNull();
	if (headingBox) {
		expect(headingBox.width).toBeGreaterThan(800);
	}
});
