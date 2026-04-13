"use client";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async () => {
	const actual =
		await vi.importActual<typeof import("next/navigation")>("next/navigation");
	return {
		...actual,
		useRouter: () => ({
			push: vi.fn(),
			replace: vi.fn(),
			back: vi.fn(),
			refresh: vi.fn(),
		}),
		useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
	};
});

vi.mock("~/trpc/react", () => ({
	api: {
		adminDeclarations: {
			search: {
				useQuery: vi.fn().mockReturnValue({
					data: {
						rows: [
							{
								id: "decl-1",
								siren: "123456789",
								year: 2024,
								status: "submitted",
								remunerationScore: 85,
								createdAt: new Date("2024-06-15T10:00:00Z"),
								updatedAt: new Date("2024-06-15T10:00:00Z"),
								companyName: "ACME Corp",
								declarantEmail: "alice@example.com",
								declarantFirstName: "Alice",
								declarantLastName: "Dupont",
							},
						],
						total: 1,
						page: 1,
						pageSize: 20,
						totalPages: 1,
					},
					isLoading: false,
				}),
			},
		},
	},
}));

import { AdminDeclarationsPage } from "../AdminDeclarationsPage";

describe("AdminDeclarationsPage", () => {
	it("renders page title", () => {
		render(<AdminDeclarationsPage />);
		expect(
			screen.getByRole("heading", { level: 1, name: "Déclarations" }),
		).toBeInTheDocument();
	});

	it("renders search form", () => {
		render(<AdminDeclarationsPage />);
		expect(
			screen.getByRole("button", { name: "Rechercher" }),
		).toBeInTheDocument();
	});

	it("renders table with data", () => {
		render(<AdminDeclarationsPage />);
		expect(screen.getByText("ACME Corp")).toBeInTheDocument();
		expect(screen.getByText("123456789")).toBeInTheDocument();
	});

	it("shows result count", () => {
		render(<AdminDeclarationsPage />);
		expect(screen.getByText("1 résultat")).toBeInTheDocument();
	});
});
