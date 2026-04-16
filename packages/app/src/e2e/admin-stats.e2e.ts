import { expect, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";

test("admin user can access /admin/stats and sees the declaration rate tile", async ({
	page,
}) => {
	await page.goto("/admin/stats");
	await expect(
		page.getByRole("heading", { name: "Statistiques", level: 1 }),
	).toBeVisible();

	const currentYear = getCurrentYear();
	await expect(
		page.getByRole("heading", {
			name: `Taux de déclaration ${currentYear}`,
			level: 3,
		}),
	).toBeVisible();
});

test("admin can change year and effectif filters on /admin/stats", async ({
	page,
}) => {
	await page.goto("/admin/stats");

	const currentYear = getCurrentYear();
	const previousYear = currentYear - 1;

	await page.getByLabel("Année").selectOption(String(previousYear));
	await expect(
		page.getByRole("heading", {
			name: `Taux de déclaration ${previousYear}`,
			level: 3,
		}),
	).toBeVisible();

	await page.getByLabel("Filtrer par effectif").selectOption("100-149");
	await expect(page.getByLabel("Filtrer par effectif")).toHaveValue("100-149");
});

test("unauthenticated user visiting /admin/stats is redirected to /login", async ({
	browser,
}) => {
	const anonCtx = await browser.newContext({ storageState: undefined });
	try {
		const page = await anonCtx.newPage();
		await page.goto("/admin/stats");
		await page.waitForURL("**/login**");
		expect(page.url()).toContain("/login");
	} finally {
		await anonCtx.close();
	}
});
