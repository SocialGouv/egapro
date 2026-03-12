import { type Page, test } from "@playwright/test";

import { scanPage } from "./helpers/axe-scan";
import { loginWithProConnect } from "./helpers/login";

/** Scan a page with axe-core and attach results to the test report (no assertion). */
async function auditPage(page: Page, path: string, label: string) {
	await page.goto(path, { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(2000);
	const result = await scanPage(page, label);

	await test.info().attach("axe-results", {
		body: JSON.stringify(result, null, 2),
		contentType: "application/json",
	});
}

// -- Public pages --

test.describe("RGAA audit — public pages", () => {
	test("Accueil (/)", async ({ page }) => {
		await auditPage(page, "/", "Accueil");
	});

	test("Connexion (/login)", async ({ page }) => {
		await auditPage(page, "/login", "Connexion");
	});

	test("404", async ({ page }) => {
		await auditPage(page, "/page-inexistante", "404 Not Found");
	});
});

// -- Authenticated pages --

test.describe("RGAA audit — authenticated pages", () => {
	test.beforeEach(async ({ page }) => {
		await loginWithProConnect(page);
	});

	test("Déclaration — Introduction", async ({ page }) => {
		await auditPage(
			page,
			"/declaration-remuneration",
			"Déclaration — Introduction",
		);
	});

	for (const step of [1, 2, 3, 4, 5, 6]) {
		test(`Déclaration — Étape ${step}`, async ({ page }) => {
			await auditPage(
				page,
				`/declaration-remuneration/etape/${step}`,
				`Déclaration — Étape ${step}`,
			);
		});
	}

	test("Mon espace", async ({ page }) => {
		await auditPage(page, "/mon-espace", "Mon espace");
	});

	test("Mes entreprises", async ({ page }) => {
		await auditPage(page, "/mon-espace/mes-entreprises", "Mes entreprises");
	});
});
