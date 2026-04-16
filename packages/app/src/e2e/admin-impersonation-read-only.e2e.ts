import { expect, test } from "@playwright/test";

import {
	ensureCurrentYearDeclaration,
	resetDeclarationToDraft,
} from "./helpers/db";

const TEST_SIREN = "130025265";

test.describe("admin impersonation — read-only guards", () => {
	test.beforeEach(async () => {
		// A declaration row must exist before impersonation starts, because
		// `declaration.getOrCreate` blocks the insert branch during mimoquage
		// (issue #3230). The server component on step 1 calls getOrCreate on
		// every render and would otherwise throw FORBIDDEN.
		await ensureCurrentYearDeclaration();
		await resetDeclarationToDraft();
	});

	test.afterEach(async ({ page }) => {
		// Best-effort stop of any impersonation left over so the next test
		// (or the next describe block) starts from a clean session.
		await page.goto("/admin/impersonate");
		const stopBtn = page.getByRole("button", { name: /arrêter le mimoquage/i });
		if (await stopBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
			await stopBtn.click();
		}
	});

	test("form submit is disabled with a read-only tooltip during mimoquage", async ({
		page,
	}) => {
		await page.goto("/admin/impersonate");
		await page.getByLabel("SIREN de l'entreprise").fill(TEST_SIREN);
		await page.getByRole("button", { name: "Rechercher" }).click();
		await page.getByRole("button", { name: /valider et mimoquer/i }).click();

		await page.waitForURL("**/mon-espace");
		await expect(page.getByText(/vous mimoquez l'entreprise/i)).toBeVisible();

		await page.goto("/declaration-remuneration/etape/1");

		const submitButton = page.getByRole("button", { name: /suivant/i });
		await expect(submitButton).toBeVisible();
		await expect(submitButton).toBeDisabled();
		const tooltipId = await submitButton.getAttribute("aria-describedby");
		expect(tooltipId).not.toBeNull();
		await expect(page.locator(`#${tooltipId}`)).toContainText(/mimoquage/i);
	});

	test("file upload endpoint returns 403 during impersonation", async ({
		page,
	}) => {
		await page.goto("/admin/impersonate");
		await page.getByLabel("SIREN de l'entreprise").fill(TEST_SIREN);
		await page.getByRole("button", { name: "Rechercher" }).click();
		await page.getByRole("button", { name: /valider et mimoquer/i }).click();
		await page.waitForURL("**/mon-espace");

		const response = await page.request.post("/api/upload", {
			headers: {
				"content-type": "application/pdf",
				"x-filename": "impersonated.pdf",
				"x-flow-type": "cse_opinion",
			},
			data: Buffer.from("%PDF-"),
		});
		expect(response.status()).toBe(403);
		const body = await response.json();
		expect(body.error).toMatch(/mimoquage/i);
	});
});
