import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import type { CompanyLocation } from "./helpers/db";
import { getCompanyLocation, setCompanyLocation } from "./helpers/db";
import { dismissCookieBanner, loginWithProConnect } from "./helpers/login";

test.describe("Login page", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("displays ProConnect button", async ({ page }) => {
		await page.goto("/login");
		await dismissCookieBanner(page);

		await expect(
			page.getByRole("button", { name: /s.identifier avec\s*proconnect/i }),
		).toBeVisible();
	});

	test("hides the public help banner", async ({ page }) => {
		await page.goto("/login");
		await dismissCookieBanner(page);

		await expect(
			page.getByRole("region", { name: /ressources et aide/i }),
		).toHaveCount(0);
	});
});

test.describe("ProConnect authentication flow", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("redirects to mon espace after login", async ({ page }) => {
		await loginWithProConnect(page);

		await page.waitForURL("**/mon-espace");
		await expect(
			page.getByRole("button", { name: "Mon espace" }),
		).toBeVisible();

		await expect(page.getByText(/130.?025.?265/).first()).toBeVisible();

		// #4256: the company banner opens on the company name. Only a real render catches a
		// breadcrumb re-injected by the layout rather than by CompanyInfoBanner itself.
		await expect(page.locator(".fr-breadcrumb")).toHaveCount(0);
	});

	test("redirects to mon espace when already logged in", async ({ page }) => {
		await loginWithProConnect(page);

		await page.goto("/login");

		await page.waitForURL("**/mon-espace", {
			timeout: 15_000,
		});

		// Verify we are no longer on the login page
		await expect(
			page.getByRole("button", { name: /s.identifier avec\s*proconnect/i }),
		).not.toBeVisible();
	});
});

test.describe("Mon espace — location row of the company banner", () => {
	test.describe.configure({ mode: "serial" });

	const SEEDED_ADDRESS = "12 RUE DE LA PAIX 75002 PARIS";

	let baseline: CompanyLocation;

	test.beforeAll(async () => {
		baseline = await getCompanyLocation();
	});

	test.afterAll(async () => {
		await setCompanyLocation(baseline);
	});

	// The edit modal repeats SIREN and address in a <dl> of its own, so the absence
	// assertions only mean something once scoped to the banner — identified as the
	// SIREN list that is not the modal's, rather than by DOM order.
	function locationList(page: Page) {
		return page
			.locator("dl")
			.filter({ hasText: "SIREN :" })
			.filter({ hasNot: page.getByText("Raison sociale :") });
	}

	test("shows the country of a foreign head office instead of its address", async ({
		page,
	}) => {
		await setCompanyLocation({
			address: SEEDED_ADDRESS,
			countryCode: "99248",
			countryLabel: "QATAR",
		});

		await page.goto("/mon-espace");

		await expect(locationList(page).locator("dt")).toHaveText([
			"SIREN :",
			"Pays :",
		]);
		await expect(locationList(page).locator("dd").last()).toHaveText("Qatar");
	});

	test("renders a composed country label in title case", async ({ page }) => {
		await setCompanyLocation({
			address: SEEDED_ADDRESS,
			countryCode: "99123",
			countryLabel: "AFRIQUE DU SUD",
		});

		await page.goto("/mon-espace");

		await expect(locationList(page).locator("dd").last()).toHaveText(
			"Afrique du Sud",
		);
	});

	test("keeps the address of a French company", async ({ page }) => {
		await setCompanyLocation({
			address: SEEDED_ADDRESS,
			countryCode: null,
			countryLabel: "FRANCE",
		});

		await page.goto("/mon-espace");

		await expect(locationList(page).locator("dt")).toHaveText([
			"SIREN :",
			"Adresse :",
		]);
		await expect(locationList(page).locator("dd").last()).toHaveText(
			"12 Rue de la Paix 75002 Paris",
		);
	});

	test("shows « non renseigné » when the country is unresolved", async ({
		page,
	}) => {
		await setCompanyLocation({
			address: SEEDED_ADDRESS,
			countryCode: null,
			countryLabel: null,
		});

		await page.goto("/mon-espace");

		await expect(locationList(page).locator("dt")).toHaveText([
			"SIREN :",
			"Pays :",
		]);
		await expect(locationList(page).locator("dd")).toHaveText([
			"130 025 265",
			"non renseigné",
		]);
	});
});
