import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/trpc/react", () => ({
	api: {},
}));

import {
	CompanySection,
	CseOpinionsSection,
	DeclarantSection,
	DeclarationSummary,
	FilesSection,
} from "../DetailSections";
import type { DeclarationDetail } from "../types";

const declaration: DeclarationDetail = {
	id: "decl-1",
	siren: "123456789",
	year: 2024,
	status: "awaiting_compliance_path_choice",
	currentStep: 6,
	totalWomen: 120,
	totalMen: 80,
	remunerationScore: 85,
	firstDeclarationPathChoice: null,
	demarcheCompletedAt: null,
	secondDeclarationSubmittedAt: null,
	createdAt: new Date("2024-03-01T10:00:00Z"),
	updatedAt: new Date("2024-06-15T10:00:00Z"),
	cancelledAt: null,
	companyName: "ACME Corp",
	companyAddress: "123 Rue de Paris",
	companyNafCode: "6201Z",
	companyWorkforce: 200,
	companyHasCse: true,
	declarantEmail: "alice@example.com",
	declarantFirstName: "Alice",
	declarantLastName: "Dupont",
	declarantPhone: "0612345678",
	files: [
		{
			id: "file-1",
			fileName: "avis-cse.pdf",
			type: "cse_opinion",
			uploadedAt: new Date("2024-04-01T10:00:00Z"),
		},
	],
	cseOpinions: [
		{
			id: "opinion-1",
			type: "favorable",
			opinion: "favorable",
			opinionDate: "2024-03-15",
		},
	],
	siblings: [],
	lock: null,
};

describe("DeclarationSummary", () => {
	it("renders all declaration fields", () => {
		render(<DeclarationSummary declaration={declaration} />);

		expect(screen.getByText("123456789")).toBeInTheDocument();
		expect(screen.getByText("2024")).toBeInTheDocument();
		expect(screen.getByText("Transmise")).toBeInTheDocument();
		expect(screen.getByText("85")).toBeInTheDocument();
	});

	it("renders dash for null fields", () => {
		render(
			<DeclarationSummary
				declaration={{ ...declaration, firstDeclarationPathChoice: null }}
			/>,
		);
		const cells = screen.getAllByText("—");
		expect(cells.length).toBeGreaterThan(0);
	});
});

describe("CompanySection", () => {
	it("renders company info", () => {
		render(<CompanySection declaration={declaration} />);

		expect(screen.getByText("ACME Corp")).toBeInTheDocument();
		expect(screen.getByText("123 Rue de Paris")).toBeInTheDocument();
		expect(screen.getByText("6201Z")).toBeInTheDocument();
		expect(screen.getByText("200")).toBeInTheDocument();
		expect(screen.getByText("Oui")).toBeInTheDocument();
	});

	it("renders Non for hasCse false", () => {
		render(
			<CompanySection declaration={{ ...declaration, companyHasCse: false }} />,
		);
		expect(screen.getByText("Non")).toBeInTheDocument();
	});

	it("renders dash for hasCse null", () => {
		render(
			<CompanySection declaration={{ ...declaration, companyHasCse: null }} />,
		);
		expect(screen.getAllByText("—").length).toBeGreaterThan(0);
	});
});

describe("DeclarantSection", () => {
	it("renders declarant info", () => {
		render(<DeclarantSection declaration={declaration} />);

		expect(screen.getByText("alice@example.com")).toBeInTheDocument();
		expect(screen.getByText("0612345678")).toBeInTheDocument();
		expect(screen.getByText(/Alice/)).toBeInTheDocument();
		expect(screen.getByText(/Dupont/)).toBeInTheDocument();
	});
});

describe("CseOpinionsSection", () => {
	it("renders opinions table", () => {
		render(<CseOpinionsSection opinions={declaration.cseOpinions} />);

		expect(
			screen.getByRole("heading", { level: 2, name: "Avis CSE" }),
		).toBeInTheDocument();
		expect(screen.getAllByText("favorable")).toHaveLength(2);
		expect(screen.getByText("2024-03-15")).toBeInTheDocument();
	});
});

describe("FilesSection", () => {
	it("renders files table with download links", () => {
		render(<FilesSection files={declaration.files} />);

		expect(
			screen.getByRole("heading", { level: 2, name: "Fichiers" }),
		).toBeInTheDocument();
		expect(screen.getByText("avis-cse.pdf")).toBeInTheDocument();
		expect(screen.getByText("Avis CSE")).toBeInTheDocument();
		const link = screen.getByRole("link", {
			name: "Télécharger avis-cse.pdf (PDF)",
		});
		expect(link).toHaveAttribute("href", "/api/v1/files/file-1");
	});
});
