import { expect, test } from "@playwright/test";

import { loginWithProConnect } from "./helpers/login";

test.describe("Logout flow", () => {
	test("logs out and returns to unauthenticated state", async ({ page }) => {
		test.setTimeout(60_000);
		await loginWithProConnect(page);

		await page.getByRole("button", { name: "Mon espace" }).click();
		await page.getByRole("menuitem", { name: "Se déconnecter" }).click();

		await page.waitForURL("**/login", { timeout: 10_000 });
		await expect(
			page.getByRole("button", { name: /s.identifier avec\s*proconnect/i }),
		).toBeVisible();
	});
});
