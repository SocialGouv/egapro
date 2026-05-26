import { expect, test } from "@playwright/test";
import { AUTH_FILE } from "./helpers/login";

test.describe("Declaration draft round-trip", () => {
	test.describe.configure({ mode: "serial" });

	test("S1 — restores workforce draft from a second browser context", async ({
		browser,
	}) => {
		const ctx1 = await browser.newContext({ storageState: AUTH_FILE });
		const page1 = await ctx1.newPage();
		try {
			await page1.goto("/declaration-remuneration/etape/1");
			await page1.waitForURL("**/declaration-remuneration/etape/1");

			const womenInput1 = page1.getByRole("textbox", {
				name: "Nombre de femmes",
			});
			await womenInput1.fill("75");

			await page1.waitForResponse(
				(r) =>
					r.url().includes("declarationDraft.save") &&
					r.request().method() === "POST" &&
					r.status() === 200,
				{ timeout: 10_000 },
			);
		} finally {
			await ctx1.close();
		}

		const ctx2 = await browser.newContext({ storageState: AUTH_FILE });
		const page2 = await ctx2.newPage();
		try {
			await page2.goto("/declaration-remuneration/etape/1");
			await page2.waitForURL("**/declaration-remuneration/etape/1");

			const womenInput2 = page2.getByRole("textbox", {
				name: "Nombre de femmes",
			});
			await expect(womenInput2).toHaveValue("75", { timeout: 10_000 });
		} finally {
			await ctx2.close();
		}
	});
});
