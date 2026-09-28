import type { Page } from "@playwright/test";
import { ADMIN_IMPERSONATE, MY_SPACE } from "~/modules/routes";
import { urlGlob } from "./routes";

/** Start admin impersonation ("mimoquage") of a company by SIREN. */
export async function startImpersonation(page: Page, siren: string) {
	await page.goto(ADMIN_IMPERSONATE);
	await page.getByLabel("SIREN de l'entreprise").fill(siren);
	await page.getByRole("button", { name: "Rechercher" }).click();
	await page.getByRole("button", { name: /valider et mimoquer/i }).click();
	await page.waitForURL(urlGlob(MY_SPACE));
}

/** Best-effort stop of any active impersonation so the next test starts clean. */
export async function stopImpersonation(page: Page) {
	await page.goto(ADMIN_IMPERSONATE);
	const stopBtn = page.getByRole("button", { name: /arrêter le mimoquage/i });
	if (await stopBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
		await stopBtn.click();
	}
}
