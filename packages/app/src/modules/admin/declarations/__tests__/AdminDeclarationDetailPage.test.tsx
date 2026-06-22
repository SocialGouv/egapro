import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/trpc/react", () => ({
	api: {
		adminDeclarations: {
			getById: {
				useQuery: vi.fn().mockReturnValue({
					data: {
						id: "decl-1",
						siren: "123456789",
						year: 2024,
						status: "submitted",
						currentStep: 6,
						totalWomen: 120,
						totalMen: 80,
						remunerationScore: 85,
						firstDeclarationPathChoice: null,
						secondDeclarationPathChoice: null,
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
					},
					isLoading: false,
				}),
			},
			getRecap: {
				useQuery: vi.fn().mockReturnValue({ data: undefined }),
			},
		},
	},
}));

import { AdminDeclarationDetailPage } from "../AdminDeclarationDetailPage";

describe("AdminDeclarationDetailPage", () => {
	it("displays declaration header", () => {
		render(<AdminDeclarationDetailPage declarationId="decl-1" />);

		expect(
			screen.getByRole("heading", { level: 1, name: "ACME Corp — 2024" }),
		).toBeInTheDocument();
	});

	it("displays company information", () => {
		render(<AdminDeclarationDetailPage declarationId="decl-1" />);

		expect(screen.getByText("123 Rue de Paris")).toBeInTheDocument();
		expect(screen.getByText("6201Z")).toBeInTheDocument();
		expect(screen.getByText("200")).toBeInTheDocument();
	});

	it("displays declarant information", () => {
		render(<AdminDeclarationDetailPage declarationId="decl-1" />);

		expect(screen.getByText("alice@example.com")).toBeInTheDocument();
		expect(screen.getByText("0612345678")).toBeInTheDocument();
	});

	it("displays CSE opinions section", () => {
		render(<AdminDeclarationDetailPage declarationId="decl-1" />);

		expect(
			screen.getByRole("heading", { level: 2, name: "Avis CSE" }),
		).toBeInTheDocument();
	});

	it("displays files section with download link", () => {
		render(<AdminDeclarationDetailPage declarationId="decl-1" />);

		expect(
			screen.getByRole("heading", { level: 2, name: "Fichiers" }),
		).toBeInTheDocument();
		expect(screen.getByText("avis-cse.pdf")).toBeInTheDocument();
		const downloadLink = screen.getByRole("link", {
			name: "Télécharger avis-cse.pdf",
		});
		expect(downloadLink).toHaveAttribute("href", "/api/v1/files/file-1");
	});

	it("displays back link", () => {
		render(<AdminDeclarationDetailPage declarationId="decl-1" />);

		expect(
			screen.getByRole("link", { name: /Retour à la liste/ }),
		).toHaveAttribute("href", "/admin/declarations");
	});
});
