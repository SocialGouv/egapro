import { expect, type Page, test } from "@playwright/test";

import { scanPage } from "./helpers/axe-scan";
import { loginWithProConnect } from "./helpers/login";

const VIOLATION_MESSAGE = (count: number, path: string) =>
	`${count} accessibility violation(s) found on ${path}`;

async function auditPage(page: Page, path: string, label: string) {
	await page.goto(path);
	await page.waitForLoadState("networkidle");
	const result = await scanPage(page, label);

	await test.info().attach("axe-results", {
		body: JSON.stringify(result, null, 2),
		contentType: "application/json",
	});

	expect(
		result.violations,
		VIOLATION_MESSAGE(result.violations.length, path),
	).toHaveLength(0);
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

	test("Mes entreprises", async ({ page }) => {
		await auditPage(page, "/mon-espace/mes-entreprises", "Mes entreprises");
	});
});
