import { expect, test } from "@playwright/test";

import { deleteReferents, seedReferents } from "./helpers/db";

const TEST_REFERENTS = [
	{
		id: "e2e-ref-idf-75-0000-000000000000",
		region: "11",
		county: "75",
		name: "E2E Référent Paris",
		type: "email" as const,
		value: "e2e-paris@dreets.test",
		principal: true,
		substituteName: "Suppléant Paris",
		substituteEmail: "e2e-paris-sub@dreets.test",
	},
	{
		id: "e2e-ref-idf-92-0000-000000000000",
		region: "11",
		county: "92",
		name: "E2E Référent Hauts-de-Seine",
		type: "url" as const,
		value: "https://dreets.test/contact-92",
		principal: false,
		substituteName: null,
		substituteEmail: null,
	},
	{
		id: "e2e-ref-bretagne-0000-000000000000",
		region: "53",
		county: "35",
		name: "E2E Référent Rennes",
		type: "email" as const,
		value: "e2e-rennes@dreets.test",
		principal: true,
		substituteName: null,
		substituteEmail: null,
	},
];

test.beforeAll(async () => {
	await seedReferents(TEST_REFERENTS);
});

test.afterAll(async () => {
	await deleteReferents(TEST_REFERENTS.map((r) => r.id));
});

test.describe("public referents search", () => {
	test("anonymous user can access /referents without authentication", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto("/referents");
			await expect(
				page.getByRole("heading", {
					name: /référents égalité professionnelle/i,
					level: 1,
				}),
			).toBeVisible();
			expect(page.url()).toContain("/referents");
		} finally {
			await anonCtx.close();
		}
	});

	test("search by region filters the results", async ({ browser }) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto("/referents");
			await page.getByLabel("Région").selectOption("11");
			await page.getByRole("button", { name: /^rechercher$/i }).click();

			await expect(page.getByText("E2E Référent Paris")).toBeVisible();
			await expect(
				page.getByText("E2E Référent Hauts-de-Seine"),
			).toBeVisible();
			await expect(page.getByText("E2E Référent Rennes")).not.toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});

	test("search by name filters the results", async ({ browser }) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto("/referents");
			await page.getByLabel("Nom du référent").fill("Rennes");
			await page.getByRole("button", { name: /^rechercher$/i }).click();

			await expect(page.getByText("E2E Référent Rennes")).toBeVisible();
			await expect(page.getByText("E2E Référent Paris")).not.toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});

	test("search with no matches shows the empty state", async ({ browser }) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto("/referents");
			await page
				.getByLabel("Nom du référent")
				.fill("ZZZZ-nonexistent-name-XXX");
			await page.getByRole("button", { name: /^rechercher$/i }).click();

			await expect(page.getByText(/aucun référent/i)).toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});

	test("list page does not show contact details", async ({ browser }) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto("/referents");
			await expect(page.getByText("E2E Référent Paris")).toBeVisible();
			await expect(
				page.getByText("e2e-paris@dreets.test"),
			).not.toBeVisible();
			await expect(
				page.getByText("e2e-paris-sub@dreets.test"),
			).not.toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});

	test("click-through to detail page reveals contact info", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto("/referents");

			const row = page.locator("li", { hasText: "E2E Référent Paris" });
			await row.getByRole("link", { name: /voir le contact/i }).click();

			await expect(
				page.getByRole("heading", {
					level: 1,
					name: /E2E Référent Paris/,
				}),
			).toBeVisible();
			await expect(page.getByText("e2e-paris@dreets.test")).toBeVisible();
			await expect(page.getByText("Suppléant Paris")).toBeVisible();
			await expect(page.getByText("e2e-paris-sub@dreets.test")).toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});

	test("URL-type referent is rendered as an external link", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto("/referents/e2e-ref-idf-92-0000-000000000000");

			const externalLink = page.getByRole("link", {
				name: /dreets\.test\/contact-92/i,
			});
			await expect(externalLink).toBeVisible();
			await expect(externalLink).toHaveAttribute("target", "_blank");
		} finally {
			await anonCtx.close();
		}
	});

	test("detail page returns 404 for unknown id", async ({ browser }) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			const response = await page.goto(
				"/referents/00000000-0000-4000-8000-000000000000",
			);
			expect(response?.status()).toBe(404);
		} finally {
			await anonCtx.close();
		}
	});
});

test("link from /aide/nous-contacter points to /referents", async ({
	browser,
}) => {
	const anonCtx = await browser.newContext({ storageState: undefined });
	try {
		const page = await anonCtx.newPage();
		await page.goto("/aide/nous-contacter");
		const searchLink = page.getByRole("link", {
			name: /rechercher un référent par région ou département/i,
		});
		await expect(searchLink).toBeVisible();
		await expect(searchLink).toHaveAttribute("href", "/referents");
	} finally {
		await anonCtx.close();
	}
});
