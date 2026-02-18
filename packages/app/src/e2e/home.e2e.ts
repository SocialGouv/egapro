import { expect, test } from "@playwright/test";

test("home page renders hello world", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByText("hello world")).toBeVisible();
});
