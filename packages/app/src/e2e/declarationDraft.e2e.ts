import { expect, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import { remunerationStepHref } from "~/modules/routes";
import {
	pushCampaignDeadlinesFarFuture,
	resetDeclarationToDraft,
} from "./helpers/db";
import { AUTH_FILE } from "./helpers/login";

test.describe("Declaration draft round-trip", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		await pushCampaignDeadlinesFarFuture();
		await resetDeclarationToDraft();
	});

	test("S1 — restores workforce draft from a second browser context", async ({
		browser,
	}) => {
		test.setTimeout(120_000);

		const ctx1 = await browser.newContext({ storageState: AUTH_FILE });
		const page1 = await ctx1.newPage();
		try {
			await page1.goto(remunerationStepHref(1));
			await page1.waitForURL(urlGlob(remunerationStepHref(1)));

			const womenInput1 = page1.getByRole("textbox", {
				name: "Rémunération annuelle — Nombre de femmes",
			});
			await expect(womenInput1).toBeVisible({ timeout: 30_000 });
			await womenInput1.fill("75");

			// The tRPC batch-stream link always answers HTTP 200 — headers go out
			// before the procedure runs, and stay 200 even on failure — so
			// `r.status() === 200` proves nothing about persistence. Only the
			// completed streamed body (a "result" entry, no "error") does (#4102).
			await page1.waitForResponse(
				async (r) => {
					if (
						!r.url().includes("declarationDraft.save") ||
						r.request().method() !== "POST"
					) {
						return false;
					}
					const body = await r.text();
					return body.includes('"result"') && !body.includes('"error"');
				},
				{ timeout: 15_000 },
			);
		} finally {
			await ctx1.close();
		}

		const ctx2 = await browser.newContext({ storageState: AUTH_FILE });
		const page2 = await ctx2.newPage();
		try {
			await page2.goto(remunerationStepHref(1));
			await page2.waitForURL(urlGlob(remunerationStepHref(1)));

			const womenInput2 = page2.getByRole("textbox", {
				name: "Rémunération annuelle — Nombre de femmes",
			});
			await expect(womenInput2).toHaveValue("75", { timeout: 30_000 });
		} finally {
			await ctx2.close();
		}
	});
});
