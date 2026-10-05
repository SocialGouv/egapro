import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import {
	HOME,
	LOGIN,
	MY_SPACE,
	OBSERVATORY_SEARCH,
	observatoryCompanyHref,
	routeWithQuery,
} from "~/modules/routes";
import { TEST_SIREN } from "./constants";
import type { CompanyLocation } from "./helpers/db";
import {
	cleanCurrentYearDeclarations,
	getCompanyLocation,
	seedDeclarationForYear,
	setCompanyLocation,
} from "./helpers/db";
import {
	type CampaignPublicRelease,
	deleteCampaignDeadlines,
	getCampaignPublicRelease,
	setPublicDataReleaseDate,
} from "./helpers/db-campaign";
import { dismissCookieBanner, loginWithProConnect } from "./helpers/login";

test.describe("Login page", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("displays ProConnect button", async ({ page }) => {
		await page.goto(LOGIN);
		await dismissCookieBanner(page);

		await expect(
			page.getByRole("button", { name: /s.identifier avec\s*proconnect/i }),
		).toBeVisible();
	});

	test("keeps ProConnect within a mobile viewport at 200% zoom", async ({
		page,
	}) => {
		// 390 physical pixels at 200% browser zoom yield a 195px CSS viewport.
		await page.setViewportSize({ width: 195, height: 422 });
		await page.goto(LOGIN);
		await dismissCookieBanner(page);

		const button = page.getByRole("button", {
			name: /s.identifier avec\s*proconnect/i,
		});
		await expect(button.locator(".fr-connect__login")).toBeVisible();
		await expect(button.locator(".fr-connect__brand")).toBeVisible();
		await expect(
			page.getByRole("link", { name: /qu.est-ce que proconnect/i }),
		).toBeVisible();
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth),
		).toBeLessThanOrEqual(195);
	});

	test("hides the public help banner", async ({ page }) => {
		await page.goto(LOGIN);
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

		await page.waitForURL(urlGlob(MY_SPACE));
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

		await page.goto(LOGIN);

		await page.waitForURL(urlGlob(MY_SPACE), {
			timeout: 15_000,
		});

		// Verify we are no longer on the login page
		await expect(
			page.getByRole("button", { name: /s.identifier avec\s*proconnect/i }),
		).not.toBeVisible();
	});
});

// Merged from home.e2e.ts (#4114). A file-level describe on purpose: this needs the
// shared session of the `chromium` project, so it must stay out of the two describes
// above, which opt into an anonymous context via `storageState: { cookies: [], origins: [] }`.
// It is the twin of "redirects to mon espace when already logged in" — same redirect,
// entered from "/" instead of /login.
test.describe("Authenticated home redirect", () => {
	test("home page redirects authenticated user to mon-espace", async ({
		page,
	}) => {
		await page.goto(HOME);
		await page.waitForURL(urlGlob(MY_SPACE));
		expect(page.url()).toContain(MY_SPACE);
	});
});

test.describe("Company location row — Mon espace banner and observatory", () => {
	test.describe.configure({ mode: "serial" });

	const SEEDED_ADDRESS = "12 RUE DE LA PAIX 75002 PARIS";
	const STREET_ONLY_ADDRESS = "12 RUE DE LA DEMO";
	// Far below every year another spec pins, so its teardown cannot collide.
	const PUBLISHED_YEAR = 2016;
	const NO_DEPARTMENT = {
		departmentCode: null,
		departmentLabel: null,
		regionCode: null,
		region: null,
	};
	const PARIS = {
		departmentCode: "75",
		departmentLabel: "Paris",
		regionCode: "11",
		region: "Île-de-France",
	};

	let baseline: CompanyLocation;
	let releaseBaseline: CampaignPublicRelease;

	test.beforeAll(async () => {
		baseline = await getCompanyLocation();
		releaseBaseline = await getCampaignPublicRelease(PUBLISHED_YEAR);
		await seedDeclarationForYear(PUBLISHED_YEAR, "demarche_completed", 6);
		await setPublicDataReleaseDate(
			PUBLISHED_YEAR,
			`${PUBLISHED_YEAR + 1}-03-01`,
		);
	});

	test.afterAll(async () => {
		await setCompanyLocation(baseline);
		await cleanCurrentYearDeclarations(PUBLISHED_YEAR);
		if (releaseBaseline.exists) {
			await setPublicDataReleaseDate(
				PUBLISHED_YEAR,
				releaseBaseline.publicDataReleaseDate,
			);
		} else {
			await deleteCampaignDeadlines(PUBLISHED_YEAR);
		}
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

	async function expectObservatoryLocation(
		page: Page,
		searchRow: string,
		companyPageRow = searchRow,
	) {
		await test.step("search result", async () => {
			await page.goto(routeWithQuery(OBSERVATORY_SEARCH, `q=${TEST_SIREN}`));
			const facts = page
				.getByRole("article")
				.filter({ hasText: TEST_SIREN })
				.locator("p > span");
			await expect(facts.nth(1)).toHaveText(searchRow);
		});

		await test.step("company page", async () => {
			await page.goto(observatoryCompanyHref(TEST_SIREN));
			await expect(
				page
					.locator("p")
					.filter({ hasText: "SIREN :" })
					.locator(":scope > span"),
			).toHaveText([`SIREN : ${TEST_SIREN}`, companyPageRow]);
		});
	}

	test("shows the country of a foreign head office instead of its address", async ({
		page,
	}) => {
		await setCompanyLocation({
			address: SEEDED_ADDRESS,
			countryCode: "99248",
			countryLabel: "QATAR",
			...NO_DEPARTMENT,
		});

		await page.goto(MY_SPACE);

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
			...NO_DEPARTMENT,
		});

		await page.goto(MY_SPACE);

		await expect(locationList(page).locator("dd").last()).toHaveText(
			"Afrique du Sud",
		);
	});

	test("keeps the address of a French company", async ({ page }) => {
		await setCompanyLocation({
			address: SEEDED_ADDRESS,
			countryCode: null,
			countryLabel: "FRANCE",
			...PARIS,
		});

		await page.goto(MY_SPACE);

		await expect(locationList(page).locator("dt")).toHaveText([
			"SIREN :",
			"Adresse :",
		]);
		await expect(locationList(page).locator("dd").last()).toHaveText(
			"12 Rue de la Paix 75002 Paris",
		);
	});

	test("names a known foreign country alike on all three surfaces, never its bare street", async ({
		page,
	}) => {
		await setCompanyLocation({
			address: STREET_ONLY_ADDRESS,
			countryCode: "99131",
			countryLabel: "BELGIQUE",
			...NO_DEPARTMENT,
		});

		await page.goto(MY_SPACE);
		await expect(locationList(page).locator("dt")).toHaveText([
			"SIREN :",
			"Pays :",
		]);
		await expect(locationList(page).locator("dd").last()).toHaveText(
			"Belgique",
		);

		await expectObservatoryLocation(page, "Pays : Belgique");
		await expect(page.getByText(STREET_ONLY_ADDRESS)).toHaveCount(0);
	});

	test("shows « inconnu » on all three surfaces when the country is unresolved", async ({
		page,
	}) => {
		await setCompanyLocation({
			address: STREET_ONLY_ADDRESS,
			countryCode: null,
			countryLabel: null,
			...NO_DEPARTMENT,
		});

		await page.goto(MY_SPACE);
		await expect(locationList(page).locator("dt")).toHaveText([
			"SIREN :",
			"Pays :",
		]);
		await expect(locationList(page).locator("dd")).toHaveText([
			"130 025 265",
			"inconnu",
		]);

		await expectObservatoryLocation(page, "Pays : inconnu");
		await expect(page.getByText(STREET_ONLY_ADDRESS)).toHaveCount(0);
		await expect(
			page.locator('script[type="application/ld+json"]'),
		).not.toContainText("addressCountry");
	});

	test("reads a company with no country but a French département as French", async ({
		page,
	}) => {
		await setCompanyLocation({
			address: SEEDED_ADDRESS,
			countryCode: null,
			countryLabel: null,
			...PARIS,
		});

		await page.goto(MY_SPACE);
		await expect(locationList(page).locator("dt")).toHaveText([
			"SIREN :",
			"Adresse :",
		]);
		await expect(locationList(page).locator("dd").last()).toHaveText(
			"12 Rue de la Paix 75002 Paris",
		);

		await expectObservatoryLocation(
			page,
			"Adresse : Paris, Île-de-France",
			`Adresse : ${SEEDED_ADDRESS}`,
		);
	});
});

// #3867 removed the "mes entreprises" screen. Both header breakpoints render their own
// entry (UserAccountMenu on desktop, MobileUserBlock inside the DSFR modal), so a single
// viewport would leave half the change unasserted. Each test starts from "/" so landing
// on /mon-espace is a real navigation rather than a URL that already matched.
test.describe("Mon espace — header entry point", () => {
	const MOBILE = { width: 375, height: 812 };

	test("the desktop user menu leads to mon espace", async ({ page }) => {
		await page.goto("/");
		await dismissCookieBanner(page);

		await page.getByRole("button", { name: "Mon espace" }).click();

		await expect(
			page.getByRole("menuitem", { name: "Mes entreprises" }),
		).toHaveCount(0);
		await page.getByRole("menuitem", { name: "Mes démarches" }).click();

		await page.waitForURL("**/mon-espace");
		await expect(page.getByText(/130.?025.?265/).first()).toBeVisible();
	});

	test("the mobile menu leads to mon espace", async ({ page }) => {
		await page.setViewportSize(MOBILE);
		await page.goto("/");
		await dismissCookieBanner(page);

		// By id: the desktop tools bar carries a button with the same accessible name.
		await page.locator("#fr-btn-menu-mobile").click();

		const menu = page.locator("#modal-menu");
		await expect(
			menu.getByRole("link", { name: "Mes entreprises" }),
		).toHaveCount(0);
		await menu.getByRole("link", { name: "Mes démarches" }).click();

		await page.waitForURL("**/mon-espace");
	});

	test("the removed mes-entreprises route is not found", async ({ page }) => {
		const response = await page.goto("/mon-espace/mes-entreprises");

		expect(response?.status()).toBe(404);
	});
});
