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
	status: "awaiting_compliance_path_choice",
	cancelledAt: null,
	remunerationScore: 85,
	createdAt: new Date("2024-06-15T10:00:00Z"),
	updatedAt: new Date("2024-06-15T10:00:00Z"),
	companyName: "ACME Corp",
	workforce: 99,
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

	it("shows SIREN, year, workforce, status, email and date", () => {
		render(<DeclarationTable {...defaultProps} />);

		expect(screen.getByText("123456789")).toBeInTheDocument();
		expect(screen.getByText("2024")).toBeInTheDocument();
		expect(screen.getByText("99")).toBeInTheDocument();
		expect(screen.getByText("Transmise")).toBeInTheDocument();
		expect(screen.getByText("alice@example.com")).toBeInTheDocument();
		expect(screen.getByText("15/06/2024")).toBeInTheDocument();
	});

	it("places the Effectif column between Année and Statut", () => {
		render(<DeclarationTable {...defaultProps} />);

		const headers = screen
			.getAllByRole("columnheader")
			.map((header) => header.textContent?.replace(/[▲▼\s]+$/, ""));
		expect(headers).toEqual([
			"SIREN",
			"Entreprise",
			"Année",
			"Effectif",
			"Statut",
			"Email déclarant",
			"Date de dépôt",
		]);

		const cells = screen.getAllByRole("cell").map((cell) => cell.textContent);
		expect(cells[2]).toBe("2024");
		expect(cells[3]).toBe("99");
		expect(cells[4]).toBe("Transmise");
	});

	it("shows a dash when the GIP headcount is unknown", () => {
		render(
			<DeclarationTable
				{...defaultProps}
				rows={[{ ...baseRow, workforce: null }]}
			/>,
		);

		const cells = screen.getAllByRole("cell").map((cell) => cell.textContent);
		expect(cells[3]).toBe("—");
	});

	it("names the workforce column and its GIP-MDS source in the caption", () => {
		render(<DeclarationTable {...defaultProps} />);

		const caption = document.querySelector("caption");
		expect(caption?.textContent).toContain("effectif");
		expect(caption?.textContent).toContain("GIP-MDS");
	});

	it("exposes aria-sort on the sorted column and hides the sort glyph", () => {
		render(<DeclarationTable {...defaultProps} />);

		const sortedHeader = screen
			.getByRole("button", { name: /date de dépôt/i })
			.closest("th");
		expect(sortedHeader).toHaveAttribute("aria-sort", "descending");

		const unsortedHeader = screen
			.getByRole("button", { name: /^siren/i })
			.closest("th");
		expect(unsortedHeader).not.toHaveAttribute("aria-sort");

		const glyph = sortedHeader?.querySelector("[aria-hidden='true']");
		expect(glyph).not.toBeNull();
	});

	it("shows empty state spanning every column when no rows", () => {
		render(<DeclarationTable {...defaultProps} rows={[]} total={0} />);

		const emptyCell = screen.getByText("Aucune déclaration trouvée.");
		expect(emptyCell).toBeInTheDocument();
		expect(emptyCell).toHaveAttribute(
			"colspan",
			String(screen.getAllByRole("columnheader").length),
		);
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

	it("shows cancelled badge when cancelledAt is set", () => {
		const cancelledRow = { ...baseRow, cancelledAt: new Date("2024-07-01") };
		render(<DeclarationTable {...defaultProps} rows={[cancelledRow]} />);

		expect(screen.getByText("Annulée")).toBeInTheDocument();
		expect(screen.queryByText("Transmise")).not.toBeInTheDocument();
	});

	it("shows status label when cancelledAt is null", () => {
		render(<DeclarationTable {...defaultProps} />);

		expect(screen.getByText("Transmise")).toBeInTheDocument();
		expect(screen.queryByText("Annulée")).not.toBeInTheDocument();
	});
});
