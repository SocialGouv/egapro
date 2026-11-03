import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicSearchResultDTO } from "~/modules/public-api";

const mocks = vi.hoisted(() => ({
	searchPublicDeclarations: vi.fn(),
}));

// The page size select needs useRouter, which the shared next/navigation mock in src/test/setup.ts lacks.
vi.mock("next/navigation", async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	usePathname: vi.fn(() => "/index-egapro/recherche"),
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("~/server/services/publicDeclarationsService", () => ({
	searchPublicDeclarations: mocks.searchPublicDeclarations,
}));

import { declarationFixture } from "./__fixtures__/declaration";
import { ConsultationSearchPage } from "./ConsultationSearchPage";

async function renderPage(result: PublicSearchResultDTO) {
	mocks.searchPublicDeclarations.mockResolvedValue(result);
	render(await ConsultationSearchPage({ searchParams: Promise.resolve({}) }));
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("ConsultationSearchPage", () => {
	it("exposes the search results as a list with one item per company", async () => {
		await renderPage({
			count: 3,
			data: [
				declarationFixture({ siren: "998900001", name: "Alpha" }),
				declarationFixture({ siren: "998900002", name: "Bêta" }),
				declarationFixture({ siren: "998900003", name: "Gamma" }),
			],
		});

		const results = screen.getByRole("region", {
			name: "3 entreprises déclarantes",
		});
		const list = within(results).getByRole("list");
		const items = within(list).getAllByRole("listitem");

		expect(list.tagName).toBe("UL");
		expect(items).toHaveLength(3);
		expect(
			items.map(
				(item) => within(item).getByRole("heading", { level: 3 }).textContent,
			),
		).toEqual(["Alpha", "Bêta", "Gamma"]);
	});

	it("keeps each result an article inside its list item", async () => {
		await renderPage({
			count: 1,
			data: [declarationFixture({ name: "Alpha" })],
		});

		const item = screen.getByRole("listitem");
		expect(within(item).getByRole("article")).toContainElement(
			screen.getByRole("link", { name: "Alpha" }),
		);
	});

	it("drops the list's bullets and indentation so the cards look unchanged", async () => {
		await renderPage({
			count: 1,
			data: [declarationFixture({ name: "Alpha" })],
		});

		expect(screen.getByRole("list")).toHaveClass("fr-raw-list");
	});

	it("renders no list when no company matches", async () => {
		await renderPage({ count: 0, data: [] });

		expect(
			screen.getByRole("heading", {
				name: "Aucune entreprise trouvée pour ces critères",
			}),
		).toBeInTheDocument();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});
});
