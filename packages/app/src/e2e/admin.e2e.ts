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

test("non-admin authenticated user visiting /admin/impersonate is redirected to /mon-espace", async ({
	page,
}) => {
	await page.goto("/admin/impersonate");
	await page.waitForURL("**/mon-espace");
	expect(page.url()).toContain("/mon-espace");
});
