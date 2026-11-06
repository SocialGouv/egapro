import { expect, test } from "@playwright/test";
import {
	CGU,
	COOKIES,
	PRIVACY,
	SITE_MAP,
	termsOfUseVersionHref,
} from "~/modules/routes";
import { urlPattern } from "./helpers/routes";

// Article wording and archive rendering are covered by src/modules/legal/__tests__/*.

const CGU_LABEL = "Conditions générales d'utilisation";
const CURRENT_CGU_DATE = "2026-10-12";
const CURRENT_CGU_DISPLAY_DATE = "12/10/2026";

test.describe("Legal pages", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("a visitor reaches the terms of use from the footer, without version history while a single version exists", async ({
		page,
	}) => {
		await test.step("the footer link leads to /cgu", async () => {
			await page.goto("/");
			await page
				.locator("footer#footer")
				.getByRole("link", { name: CGU_LABEL })
				.click();
			await page.waitForURL(urlPattern(CGU));
		});

		await test.step("the page shows the version in force and its articles", async () => {
			await expect(
				page.getByRole("heading", { level: 1, name: CGU_LABEL }),
			).toBeVisible();
			await expect(
				page.getByText(`En vigueur à partir du ${CURRENT_CGU_DISPLAY_DATE}`),
			).toBeVisible();
			await expect(
				page.getByRole("heading", { level: 2, name: /^Article 1/ }),
			).toBeVisible();
			await expect(
				page.getByRole("heading", { level: 2, name: /^Article 6/ }),
			).toBeVisible();
		});

		await test.step("a single version in force shows no version history", async () => {
			await expect(
				page.getByRole("link", {
					name: "Consulter l'historique des versions",
				}),
			).toHaveCount(0);
			await expect(
				page.getByRole("heading", { name: "Historique des versions" }),
			).toHaveCount(0);
		});
	});

	test("the archive URL of the version in force redirects to /cgu", async ({
		page,
	}) => {
		await page.goto(termsOfUseVersionHref(CURRENT_CGU_DATE));

		await page.waitForURL(urlPattern(CGU));
		await expect(
			page.getByRole("heading", { level: 1, name: CGU_LABEL }),
		).toBeVisible();
	});

	test("an unknown terms of use version returns HTTP 404", async ({ page }) => {
		const response = await page.goto(termsOfUseVersionHref("1999-01-01"));

		expect(response?.status()).toBe(404);
		await expect(
			page.getByRole("heading", { name: "Page non trouvée" }),
		).toBeVisible();
	});

	test("the site map lists the terms of use among the legal pages", async ({
		page,
	}) => {
		await page.goto(SITE_MAP);

		const legalSection = page
			.getByRole("heading", { name: "Pages légales" })
			.locator("xpath=following-sibling::ul[1]");
		await expect(
			legalSection.getByRole("link", { name: CGU_LABEL }),
		).toHaveAttribute("href", CGU);
	});

	test("the footer privacy policy link leads to the titled page that links to cookie management", async ({
		page,
	}) => {
		await page.goto("/");
		await page
			.locator("footer#footer")
			.getByRole("link", { name: "Politique de confidentialité" })
			.click();
		await page.waitForURL(urlPattern(PRIVACY));

		await expect(
			page.getByRole("heading", {
				level: 1,
				name: "Politique de confidentialité",
			}),
		).toBeVisible();
		await expect(
			page.getByRole("main").getByRole("link", { name: "Gestion des cookies" }),
		).toHaveAttribute("href", COOKIES);
	});

	for (const legacyPath of [
		"/politique-de-confidentialite",
		"/politique-de-confidentialite-v2",
	]) {
		test(`${legacyPath} permanently redirects to the privacy policy`, async ({
			request,
		}) => {
			const response = await request.get(legacyPath, { maxRedirects: 0 });

			expect(response.status()).toBe(308);
			expect(response.headers().location).toMatch(urlPattern(PRIVACY));
		});
	}
});
