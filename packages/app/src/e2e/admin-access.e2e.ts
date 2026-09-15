import { expect, type Page, test } from "@playwright/test";
import { urlGlob, urlPattern } from "~/e2e/helpers/routes";
import {
	ADMIN,
	ADMIN_DECLARATIONS,
	ADMIN_IMPERSONATE,
	ADMIN_REFERENTS,
	ADMIN_SETTINGS,
	LOGIN,
	routeWithQuery,
} from "~/modules/routes";
import {
	cleanCurrentYearDeclarations,
	seedDeclarationForYear,
	setGipWorkforce,
} from "./helpers/db";

// Merged from the former admin / admin-declarations / admin-referents specs.

test.describe("admin access", () => {
	// One test per route so a failure pinpoints the broken route; they all reuse
	// the shared auth state (no per-test login) inside this describe.
	test("admin can reach /admin (backoffice)", async ({ page }) => {
		await page.goto(ADMIN);
		await expect(
			page.getByRole("heading", { name: "Backoffice", level: 1 }),
		).toBeVisible();
		await expect(page.getByText("administrateur")).toBeVisible();
	});

	test("admin can reach /admin/impersonate", async ({ page }) => {
		await page.goto(ADMIN_IMPERSONATE);
		await expect(
			page.getByRole("heading", { name: "Mimoquer une entreprise", level: 1 }),
		).toBeVisible();
	});

	test("admin can reach /admin/parametres", async ({ page }) => {
		await page.goto(ADMIN_SETTINGS);
		await expect(
			page.getByRole("heading", {
				name: "Paramètres de la plateforme",
				level: 1,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Échéances de campagne", level: 2 }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Année de campagne active", level: 2 }),
		).not.toBeVisible();
	});

	test("admin can reach /admin/liste-referents", async ({ page }) => {
		await page.goto(ADMIN_REFERENTS);
		await expect(
			page.getByRole("heading", {
				name: "Liste des référents Egapro",
				level: 1,
			}),
		).toBeVisible();
	});

	test("admin can reach /admin/declarations", async ({ page }) => {
		await page.goto(ADMIN_DECLARATIONS);
		await page.waitForLoadState("networkidle");
		expect(page.url()).toContain(ADMIN_DECLARATIONS);
	});

	test("admin routes hide the public footer and help banner", async ({
		page,
	}) => {
		// Authenticated chromium project: /admin reaches the real backoffice, not a login-redirect fallback.
		await page.goto(ADMIN);
		await expect(
			page.getByRole("heading", { name: "Backoffice", level: 1 }),
		).toBeVisible();
		await expect(page.locator("footer#footer")).toHaveCount(0);
		await expect(
			page.getByRole("region", { name: "Ressources et aide" }),
		).toHaveCount(0);
	});

	test("unauthenticated user is redirected to /login", async ({ browser }) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto(ADMIN_DECLARATIONS);
			await page.waitForURL(urlGlob(`${LOGIN}**`));
			expect(page.url()).toContain(LOGIN);
		} finally {
			await anonCtx.close();
		}
	});
});

// Years outside the seven-campaign grid the rest of the suite pins (#4022), so these
// fixtures cannot collide with a spec that reasons in campaign years.
const FLOORED_YEAR = 2018;
const MID_RANGE_YEAR = 2019;
const UNKNOWN_YEAR = 2017;

// 99.97 must read "99": the back-office floors the GIP headcount instead of rounding it,
// so a company below the 100 threshold never reads as above it — nor filters as such.
const FLOORED_WORKFORCE = 99.97;
const FLOORED_DISPLAY = "99";
const MID_RANGE_WORKFORCE = 120;
const MID_RANGE_RANGE = "100-149";
const UNKNOWN_DISPLAY = "—";

const SEEDED_YEARS = [FLOORED_YEAR, MID_RANGE_YEAR, UNKNOWN_YEAR];

const YEAR_CELL = "td:nth-child(3)";
const WORKFORCE_CELL = "td:nth-child(4)";
const WORKFORCE_HEADER_INDEX = 3;

function rowForYear(page: Page, year: number) {
	return page.locator("tbody tr").filter({
		has: page.locator(YEAR_CELL, { hasText: new RegExp(`^${year}$`) }),
	});
}

async function workforceColumn(page: Page): Promise<string[]> {
	return page.locator(`tbody tr ${WORKFORCE_CELL}`).allTextContents();
}

/** The seeded years in the order the table currently lists them. */
async function seededYearOrder(page: Page): Promise<number[]> {
	const years = await page.locator(`tbody tr ${YEAR_CELL}`).allTextContents();
	return years.map(Number).filter((year) => SEEDED_YEARS.includes(year));
}

/** Displayed headcounts ordered as asked, unknown ones after every known one. */
function isOrderedWithUnknownsLast(
	values: string[],
	direction: "asc" | "desc",
): boolean {
	const firstUnknown = values.indexOf(UNKNOWN_DISPLAY);
	if (firstUnknown !== -1) {
		if (values.slice(firstUnknown).some((v) => v !== UNKNOWN_DISPLAY))
			return false;
	}
	const known = values
		.filter((v) => v !== UNKNOWN_DISPLAY)
		.map((v) => Number(v));
	return known.every((value, index) => {
		if (index === 0) return true;
		const previous = known[index - 1] as number;
		return direction === "asc" ? previous <= value : previous >= value;
	});
}

test.describe("admin declarations — GIP headcount column and size filter", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		await seedDeclarationForYear(FLOORED_YEAR, "draft", 1);
		await setGipWorkforce(FLOORED_WORKFORCE, FLOORED_YEAR);
		await seedDeclarationForYear(MID_RANGE_YEAR, "draft", 1);
		await setGipWorkforce(MID_RANGE_WORKFORCE, MID_RANGE_YEAR);
		// No GIP row at all: the company is absent from the file for that exercise.
		await seedDeclarationForYear(UNKNOWN_YEAR, "draft", 1);
		await setGipWorkforce(null, UNKNOWN_YEAR);
	});

	test.afterAll(async () => {
		for (const year of SEEDED_YEARS) {
			await setGipWorkforce(null, year);
			await cleanCurrentYearDeclarations(year);
		}
	});

	test("shows the floored GIP headcount between Année and Statut, and — when it is unknown", async ({
		page,
	}) => {
		await page.goto(routeWithQuery(ADMIN_DECLARATIONS, "pageSize=100"));

		const headers = page.locator("thead th");
		await expect(headers.nth(WORKFORCE_HEADER_INDEX - 1)).toHaveText(/^Année/);
		await expect(headers.nth(WORKFORCE_HEADER_INDEX)).toHaveText(/^Effectif/);
		await expect(headers.nth(WORKFORCE_HEADER_INDEX + 1)).toHaveText(/^Statut/);

		await expect(
			rowForYear(page, FLOORED_YEAR).locator(WORKFORCE_CELL),
		).toHaveText(FLOORED_DISPLAY);

		const unknownRow = rowForYear(page, UNKNOWN_YEAR);
		await expect(unknownRow).toHaveCount(1);
		await expect(unknownRow.locator(WORKFORCE_CELL)).toHaveText(
			UNKNOWN_DISPLAY,
		);
	});

	test("sorts on Effectif with unknown headcounts last in both directions", async ({
		page,
	}) => {
		await page.goto(routeWithQuery(ADMIN_DECLARATIONS, "pageSize=100"));
		const header = page.locator("thead th").nth(WORKFORCE_HEADER_INDEX);

		await header.getByRole("button").click();
		await expect(header).toHaveAttribute("aria-sort", "ascending");
		await expect
			.poll(() => seededYearOrder(page))
			.toEqual([FLOORED_YEAR, MID_RANGE_YEAR, UNKNOWN_YEAR]);
		expect(isOrderedWithUnknownsLast(await workforceColumn(page), "asc")).toBe(
			true,
		);

		await header.getByRole("button").click();
		await expect(header).toHaveAttribute("aria-sort", "descending");
		await expect
			.poll(() => seededYearOrder(page))
			.toEqual([MID_RANGE_YEAR, FLOORED_YEAR, UNKNOWN_YEAR]);
		expect(isOrderedWithUnknownsLast(await workforceColumn(page), "desc")).toBe(
			true,
		);
	});

	test("filters on a size range, over the listed rows and the result counter alike", async ({
		page,
	}) => {
		await page.goto(routeWithQuery(ADMIN_DECLARATIONS, "pageSize=100"));
		await page
			.getByRole("combobox", { name: "Effectif" })
			.selectOption(MID_RANGE_RANGE);
		await page.getByRole("button", { name: "Rechercher" }).click();
		await expect(page).toHaveURL(new RegExp(`sizeRange=${MID_RANGE_RANGE}`));

		await expect(rowForYear(page, MID_RANGE_YEAR)).toHaveCount(1);
		// 99.97 floors to 99, so the bracket must not catch it — nor the unknown headcount.
		await expect(rowForYear(page, FLOORED_YEAR)).toHaveCount(0);
		await expect(rowForYear(page, UNKNOWN_YEAR)).toHaveCount(0);

		const displayed = await workforceColumn(page);
		expect(displayed.length).toBeGreaterThan(0);
		for (const value of displayed) {
			expect(Number(value)).toBeGreaterThanOrEqual(100);
			expect(Number(value)).toBeLessThanOrEqual(149);
		}

		// Counter and rows must describe the same population, or the pagination lies.
		await expect(page.getByText(/^\d+ résultats?$/)).toHaveText(
			`${displayed.length} résultat${displayed.length > 1 ? "s" : ""}`,
		);
	});

	test("restores the size filter from the URL and clears it on Réinitialiser", async ({
		page,
	}) => {
		await page.goto(
			routeWithQuery(ADMIN_DECLARATIONS, "sizeRange=250%2B&pageSize=100"),
		);

		const filter = page.getByRole("combobox", { name: "Effectif" });
		await expect(filter).toHaveValue("250+");
		await expect(rowForYear(page, FLOORED_YEAR)).toHaveCount(0);
		await expect(rowForYear(page, UNKNOWN_YEAR)).toHaveCount(0);
		for (const value of await workforceColumn(page)) {
			expect(Number(value)).toBeGreaterThanOrEqual(250);
		}

		await page.getByRole("button", { name: "Réinitialiser" }).click();
		await expect(page).toHaveURL(urlPattern(ADMIN_DECLARATIONS));
		await expect(filter).toHaveValue("");
		await expect(rowForYear(page, UNKNOWN_YEAR)).toHaveCount(1);
	});
});
