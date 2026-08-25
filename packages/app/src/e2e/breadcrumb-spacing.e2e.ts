import { expect, test } from "@playwright/test";

// DSFR 1.14 ships `.fr-breadcrumb { margin: 1rem 0 2rem }` plus a `min-width: 48em`
// override raising the bottom margin to 2.5rem. dsfrFixes.scss neutralises both with a
// doubled-class selector, and the two banners that used to carry their own override now
// rely on it alone. Only a real browser resolves that cascade and those media queries,
// so this contract cannot be held by a jsdom unit test.

const EXPECTED_MARGIN_TOP = "0px";
const EXPECTED_MARGIN_BOTTOM = "32px";

const DESKTOP = { width: 1440, height: 900 };

// Both viewports earn their place: the stray 1rem top margin is unconditional, while the
// 2.5rem bottom margin only applies from 48em up. Desktop alone would leave the top-margin
// fix unguarded below the breakpoint.
const VIEWPORTS = [
	{ name: "desktop", ...DESKTOP },
	{ name: "mobile", width: 375, height: 800 },
];

// `/mon-espace` used to be listed here as the surface that regresses first, its
// CompanyInfoBanner carrying one of the two local `:global(.fr-breadcrumb)` overrides this
// fix deleted. #4256 removed the breadcrumb from `/mon-espace/**` altogether, leaving the
// public pages as the only surfaces the shared rule still has to apply to.
const SCREENS = [
	{ name: "legal notice", path: "/mentions-legales" },
	{ name: "FAQ", path: "/faq" },
];

test.describe("breadcrumb spacing", () => {
	for (const viewport of VIEWPORTS) {
		test.describe(`${viewport.name} (${viewport.width}px)`, () => {
			test.use({
				viewport: { width: viewport.width, height: viewport.height },
			});

			for (const screen of SCREENS) {
				test(`${screen.name} — the breadcrumb keeps no top margin and 32px below`, async ({
					page,
				}) => {
					await page.goto(screen.path);

					const breadcrumb = page.locator(".fr-breadcrumb").first();
					await expect(breadcrumb).toBeVisible();

					const margins = await breadcrumb.evaluate((element) => {
						const { marginTop, marginBottom } = getComputedStyle(element);
						return { marginTop, marginBottom };
					});

					expect(margins).toEqual({
						marginTop: EXPECTED_MARGIN_TOP,
						marginBottom: EXPECTED_MARGIN_BOTTOM,
					});
				});
			}
		});
	}

	test.describe("rendered spacing", () => {
		// Pinned to desktop: this is where DSFR's 2.5rem override applies, so an unpinned
		// viewport would silently stop exercising the branch the fix actually neutralises.
		test.use({ viewport: DESKTOP });

		// Measured on /faq specifically. On /mentions-legales, /plan-du-site and /referents the
		// next element is an `h1.fr-mt-4w`, which carries 32px of its own top margin — a gap
		// assertion there would pass with or without the fix. The FAQ's "Retour" link has no top
		// margin, so the gap comes from the breadcrumb alone; asserting that premise keeps the
		// check from silently going tautological if the page gains a spaced neighbour.
		test("the bottom margin renders as 32px of real spacing", async ({
			page,
		}) => {
			await page.goto("/faq");

			const breadcrumb = page.locator(".fr-breadcrumb").first();
			await expect(breadcrumb).toBeVisible();

			const spacing = await breadcrumb.evaluate((element) => {
				const next = element.nextElementSibling;
				if (!next) throw new Error("No element follows the breadcrumb");
				return {
					nextMarginTop: getComputedStyle(next).marginTop,
					gap: Math.round(
						next.getBoundingClientRect().top -
							element.getBoundingClientRect().bottom,
					),
				};
			});

			expect(spacing).toEqual({ nextMarginTop: "0px", gap: 32 });
		});
	});
});
