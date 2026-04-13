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

test("admin user can access /admin/impersonate and sees impersonate page", async ({
	page,
}) => {
	await page.goto("/admin/impersonate");
	await expect(
		page.getByRole("heading", { name: "Mimoquer une entreprise", level: 1 }),
	).toBeVisible();
});
