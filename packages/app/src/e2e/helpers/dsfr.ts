import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Wait for DSFR JS to finish initializing a modal dialog.
 *
 * DSFR sets `data-fr-js-modal="true"` on the dialog element before binding
 * click handlers on trigger buttons. In CI the gap between the two can exceed
 * 200 ms, so we wait for the attribute and then yield to the event loop.
 */
export async function waitForDsfrModal(page: Page, dialogId: string) {
	await page.waitForFunction(
		(id) => {
			const el = document.getElementById(id);
			return el?.getAttribute("data-fr-js-modal") === "true";
		},
		dialogId,
		{ timeout: 10_000 },
	);
	// Yield so DSFR finishes binding button handlers after the modal attribute.
	await page.waitForTimeout(300);
}

/**
 * Click a DSFR modal trigger button and wait for the dialog to open.
 *
 * If DSFR JS hasn't finished binding the click handler yet, the first click
 * is a no-op and the `open` attribute never appears. This helper retries the
 * click up to {@link maxAttempts} times to work around the race condition.
 */
export async function clickAndExpectDialogOpen(
	page: Page,
	button: Locator,
	dialogId: string,
	maxAttempts = 3,
) {
	const panel = page.locator(`#${dialogId}`);

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		await button.click();
		try {
			await expect(panel).toHaveAttribute("open", {
				timeout: attempt < maxAttempts ? 3_000 : 10_000,
			});
			return;
		} catch {
			if (attempt === maxAttempts)
				throw new Error(
					`Dialog #${dialogId} did not open after ${maxAttempts} click attempts`,
				);
			// Wait before retrying — DSFR handler may not be bound yet.
			await page.waitForTimeout(500);
		}
	}
}
