import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getPublicDeclarationsBySiren: vi.fn(),
	getPublicRepresentationsBySiren: vi.fn(),
	notFound: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
}));

// The year selector needs useRouter, which the shared next/navigation mock in src/test/setup.ts lacks.
vi.mock("next/navigation", async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	notFound: mocks.notFound,
	usePathname: vi.fn(() => "/index-egapro/entreprise/998900001"),
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("~/modules/public-api", async (importOriginal) => ({
	...(await importOriginal<typeof import("~/modules/public-api")>()),
	getPublicDeclarationsBySiren: mocks.getPublicDeclarationsBySiren,
	getPublicRepresentationsBySiren: mocks.getPublicRepresentationsBySiren,
}));

import { declarationFixture } from "./__fixtures__/declaration";
import { representationFixture } from "./__fixtures__/representation";
import { CompanyConsultationPage } from "./CompanyConsultationPage";

const SIREN = "998900001";

async function renderPage(selectedYear?: number) {
	render(await CompanyConsultationPage({ siren: SIREN, selectedYear }));
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("CompanyConsultationPage", () => {
	it("keeps showing the released remuneration when no representation is published", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([
			declarationFixture({ year: 2027 }),
		]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([]);

		await renderPage();

		expect(mocks.notFound).not.toHaveBeenCalled();
		expect(
			screen.getByText("Écarts de rémunération horaire brute moyenne"),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Aucune déclaration de représentation équilibrée pour 2027",
			),
		).toBeInTheDocument();
	});

	it("offers the union of the years returned by both services, without duplicates", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([
			declarationFixture({ year: 2027 }),
			declarationFixture({ year: 2026 }),
		]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([
			representationFixture({ year: 2026 }),
		]);

		await renderPage();

		const options = screen
			.getAllByRole("option")
			.map((option) => option.textContent);
		expect(new Set(options)).toEqual(new Set(["2027", "2026"]));
	});

	it("shows the representation of a year both families published", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([
			declarationFixture({ year: 2027 }),
		]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([
			representationFixture({ year: 2027 }),
		]);

		await renderPage();

		expect(
			screen.getByRole("heading", { name: "Écarts de représentation" }),
		).toBeInTheDocument();
		expect(
			screen.queryByText(
				"Aucune déclaration de représentation équilibrée pour 2027",
			),
		).not.toBeInTheDocument();
	});

	it("returns a not-found page when neither family is published", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([]);
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([]);

		await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
		expect(mocks.notFound).toHaveBeenCalled();
	});
});
