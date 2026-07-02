import { expect, test } from "@playwright/test";

import {
	ensureCurrentYearDeclaration,
	resetDeclarationToDraft,
} from "./helpers/db";
import { startImpersonation, stopImpersonation } from "./helpers/impersonation";

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
		await stopImpersonation(page);
	});

	test("form submit is disabled with a read-only tooltip during mimoquage", async ({
		page,
	}) => {
		await startImpersonation(page, TEST_SIREN);
		await expect(page.getByText(/vous mimoquez l'entreprise/i)).toBeVisible();

		await page.goto("/declaration-remuneration/etape/1");

		const submitButton = page.getByRole("button", { name: /suivant/i });
		await expect(submitButton).toBeVisible();
		await expect(submitButton).toBeDisabled();
		const tooltipId = await submitButton.getAttribute("aria-describedby");
		expect(tooltipId).not.toBeNull();
		await expect(page.locator(`#${tooltipId}`)).toContainText(/mimoquage/i);
	});

	// `/avis-cse/etape/1` renders under the layout's StaticLockProvider (fed by
	// `getLockReadState`, which is lock-only and stays false during mimoquage).
	// After unifying impersonation + lock into LockContext (#3765), the static
	// path must still disable writes during impersonation — exactly the surface
	// that regressed before the StaticLockProvider folded `useIsImpersonating`
	// in. The dynamic path (declaration step 1) is covered above.
	test("CSE opinion submit is disabled with a read-only tooltip during mimoquage", async ({
		page,
	}) => {
		await startImpersonation(page, TEST_SIREN);

		await page.goto("/avis-cse/etape/1");

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
		await startImpersonation(page, TEST_SIREN);

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
