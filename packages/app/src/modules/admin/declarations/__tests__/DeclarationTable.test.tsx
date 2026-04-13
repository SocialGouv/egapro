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

import { DeclarationTable } from "../DeclarationTable";
import type { DeclarationSearchRow } from "../types";

const baseRow: DeclarationSearchRow = {
	id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
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
};

const defaultProps = {
	rows: [baseRow],
	total: 1,
	page: 1,
	totalPages: 1,
	sortBy: "createdAt",
	sortOrder: "desc",
};

describe("DeclarationTable", () => {
	it("renders rows with company name as link", () => {
		render(<DeclarationTable {...defaultProps} />);

		expect(screen.getByText("ACME Corp")).toBeInTheDocument();
		expect(screen.getByText("ACME Corp").closest("a")).toHaveAttribute(
			"href",
			`/admin/declarations/${baseRow.id}`,
		);
	});

	it("shows SIREN, year, status, email and date", () => {
		render(<DeclarationTable {...defaultProps} />);

		expect(screen.getByText("123456789")).toBeInTheDocument();
		expect(screen.getByText("2024")).toBeInTheDocument();
		expect(screen.getByText("Transmise")).toBeInTheDocument();
		expect(screen.getByText("alice@example.com")).toBeInTheDocument();
		expect(screen.getByText("15/06/2024")).toBeInTheDocument();
	});

	it("shows empty state when no rows", () => {
		render(<DeclarationTable {...defaultProps} rows={[]} total={0} />);

		expect(screen.getByText("Aucune déclaration trouvée.")).toBeInTheDocument();
	});

	it("shows result count", () => {
		render(<DeclarationTable {...defaultProps} total={42} />);

		expect(screen.getByText("42 résultats")).toBeInTheDocument();
	});

	it("does not show pagination when totalPages is 1", () => {
		render(<DeclarationTable {...defaultProps} />);

		expect(
			screen.queryByRole("navigation", { name: "Pagination" }),
		).not.toBeInTheDocument();
	});

	it("shows pagination when totalPages > 1", () => {
		render(<DeclarationTable {...defaultProps} totalPages={3} />);

		expect(
			screen.getByRole("navigation", { name: "Pagination" }),
		).toBeInTheDocument();
	});
});
