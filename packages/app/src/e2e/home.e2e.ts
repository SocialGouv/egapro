import { expect, test } from "@playwright/test";
import { WORKFORCE_OBLIGATION_BRACKETS } from "~/modules/domain";
import { HOME, OBSERVATORY_SEARCH, UNDER_CONSTRUCTION } from "~/modules/routes";
import { TEST_SIREN } from "./constants";
import { dismissCookieBanner } from "./helpers/login";
import { urlPattern } from "./helpers/routes";

// Only a real browser loads the DSFR runtime, which toggles aria-pressed on its own.

const SMALL = WORKFORCE_OBLIGATION_BRACKETS["<50"].label;
const LARGE = WORKFORCE_OBLIGATION_BRACKETS["1000+"].label;
const NO_OBLIGATION =
	"Aucune obligation, déclaration facultative des indicateurs de rémunération";
const REPRESENTATION_ITEM =
	"Déclarer les indicateurs de représentation dans les postes de direction";
const DETAIL_LINK = "Voir le détail de mes obligations";
const UNDER_CONSTRUCTION_HEADING = "Page en cours de construction";

test.describe("Public home page", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("a visitor checks the obligations of a bracket, reaches the page under construction and searches a company", async ({
		page,
	}) => {
		const brackets = page.getByRole("list", {
			name: "Combien de salariés compte votre entreprise ?",
		});
		const tag = (label: string) =>
			brackets.getByRole("button", { name: label, exact: true });

		await test.step("no bracket is selected on arrival", async () => {
			await page.goto(HOME);
			await dismissCookieBanner(page);

			await expect(
				page.getByRole("heading", {
					level: 2,
					name: "Que devez-vous déclarer ?",
				}),
			).toBeVisible();
			await expect(brackets.getByRole("button")).toHaveCount(
				Object.keys(WORKFORCE_OBLIGATION_BRACKETS).length,
			);
			await expect(brackets.getByRole("button", { pressed: true })).toHaveCount(
				0,
			);
			await expect(page.getByText("Ce que vous devez faire")).toHaveCount(0);
			await expect(page.getByText("Section non finalisée")).toHaveCount(0);
		});

		await test.step("a bracket under the threshold has no obligation", async () => {
			await tag(SMALL).click();

			await expect(tag(SMALL)).toHaveAttribute("aria-pressed", "true");
			await expect(page.getByText(NO_OBLIGATION)).toBeVisible();
			await expect(page.getByRole("link", { name: DETAIL_LINK })).toHaveCount(
				0,
			);
		});

		await test.step("another bracket replaces the selection", async () => {
			await tag(LARGE).click();

			await expect(tag(LARGE)).toHaveAttribute("aria-pressed", "true");
			await expect(tag(SMALL)).toHaveAttribute("aria-pressed", "false");
			await expect(page.getByText(NO_OBLIGATION)).toHaveCount(0);
			await expect(page.getByText(REPRESENTATION_ITEM)).toBeVisible();
		});

		await test.step("clicking the selected bracket again closes it", async () => {
			await tag(LARGE).click();

			await expect(brackets.getByRole("button", { pressed: true })).toHaveCount(
				0,
			);
			await expect(page.getByText(REPRESENTATION_ITEM)).toHaveCount(0);
		});

		await test.step("the detail link leads to the page under construction and back", async () => {
			await tag(LARGE).click();
			await expect(tag(LARGE)).toHaveAttribute("aria-pressed", "true");
			await page.getByRole("link", { name: DETAIL_LINK }).click();

			await page.waitForURL(urlPattern(UNDER_CONSTRUCTION));
			await expect(
				page.getByRole("heading", {
					level: 1,
					name: UNDER_CONSTRUCTION_HEADING,
				}),
			).toBeVisible();

			await page.getByRole("link", { name: "Page d'accueil" }).click();
			await page.waitForURL(urlPattern(HOME));
		});

		await test.step("the why-declare cards lead to the page under construction", async () => {
			for (const title of [
				"Indicateurs de rémunération",
				"Indicateurs de représentation",
			]) {
				await expect(
					page
						.getByRole("heading", { level: 3, name: title })
						.getByRole("link"),
				).toHaveAttribute("href", UNDER_CONSTRUCTION);
			}
		});

		await test.step("the search sends the query to the observatory", async () => {
			const form = page.getByRole("form", {
				name: "Rechercher une entreprise",
			});
			await form
				.getByRole("searchbox", { name: /^Recherchez une entreprise/ })
				.fill(TEST_SIREN);
			await form.getByRole("button", { name: "Rechercher" }).click();

			await page.waitForURL(
				(url) =>
					url.pathname === OBSERVATORY_SEARCH &&
					url.searchParams.get("q") === TEST_SIREN,
			);
			await expect(
				page.getByRole("searchbox", {
					name: "Numéro Siren ou le nom de l'entreprise",
				}),
			).toHaveValue(TEST_SIREN);
		});
	});
});
