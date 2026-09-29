import { expect, type Locator, type Page } from "@playwright/test";
import { MY_SPACE } from "~/modules/routes";
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./dsfr";

export const PROCESS_PANEL_ID = "declaration-process-panel";

// The row's CSS-module class names are hashed, so its label is the only stable
// anchor: the label <p> sits in the info column, whose parent is the row itself.
export function transmittedRow(page: Page, label: string): Locator {
	return page
		.locator(`#${PROCESS_PANEL_ID}`)
		.getByText(label, { exact: true })
		.locator("xpath=../..");
}

export async function openPanneauDemarche(page: Page): Promise<Locator> {
	await page.goto(MY_SPACE);
	await waitForDsfrModal(page, PROCESS_PANEL_ID);
	const trigger = page.getByRole("button", { name: "Rémunération" }).first();
	await expect(trigger).toBeVisible();
	await clickAndExpectDialogOpen(page, trigger, PROCESS_PANEL_ID);
	return page.locator(`#${PROCESS_PANEL_ID}`);
}
