import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getCurrentYear } from "~/modules/domain";
import { DeclarationsSection } from "../DeclarationsSection";
import type { DeclarationItem } from "../types";

const currentYear = getCurrentYear();

const declarations: DeclarationItem[] = [
	{
		type: "remuneration",
		siren: "532847196",
		year: currentYear,
		status: "to_complete",
		currentStep: 0,
		updatedAt: null,
	},
	{
		type: "representation",
		siren: "532847196",
		year: currentYear,
		status: "to_complete",
		currentStep: 0,
		updatedAt: null,
	},
	{
		type: "remuneration",
		siren: "532847196",
		year: currentYear - 1,
		status: "done",
		currentStep: 6,
		updatedAt: new Date("2025-03-15"),
	},
];

function renderSection(
	overrides?: Partial<{ declarations: DeclarationItem[] }>,
) {
	return render(
		<DeclarationsSection
			declarations={overrides?.declarations ?? declarations}
			hasCse={true}
			hasNoSanction={false}
			siren="532847196"
			userPhone="0122334455"
		/>,
	);
}

describe("DeclarationsSection", () => {
	it("renders the 'En cours' heading", () => {
		renderSection();
		expect(
			screen.getByRole("heading", { level: 2, name: "En cours" }),
		).toBeInTheDocument();
	});

	it("renders the table column headers including Échéance and Mise à jour", () => {
		renderSection();
		expect(
			screen.getByRole("columnheader", { name: "Déclaration" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Année" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Étape" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Statut" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Échéance" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Mise à jour" }),
		).toBeInTheDocument();
	});

	it("renders declaration rows with year, status badge, and step label", () => {
		renderSection();
		expect(screen.getAllByText(String(currentYear))).toHaveLength(2);
		expect(screen.getByText(String(currentYear - 1))).toBeInTheDocument();
		expect(screen.getByText("Complétée")).toBeInTheDocument();
		expect(screen.getAllByText("À compléter")).toHaveLength(2);
		expect(screen.getByText("Effectué")).toBeInTheDocument();
	});

	it("renders 'Aucune' for declarations with no update date", () => {
		renderSection();
		expect(screen.getAllByText("Aucune")).toHaveLength(2);
	});

	it("renders formatted date for declarations with an update date", () => {
		renderSection();
		expect(screen.getByText("15/03/2025")).toBeInTheDocument();
	});

	it("renders 'Années précédentes' separator when there are past declarations", () => {
		renderSection();
		expect(screen.getByText("Années précédentes")).toBeInTheDocument();
	});

	it("renders 'Rémunération' and 'Représentation' links", () => {
		renderSection();
		const remuLinks = screen.getAllByRole("link", { name: "Rémunération" });
		expect(remuLinks).toHaveLength(2);
		const represLinks = screen.getAllByRole("link", {
			name: "Représentation",
		});
		expect(represLinks).toHaveLength(1);
	});

	it("renders the page size selector", () => {
		renderSection();
		expect(
			screen.getByRole("combobox", { name: "Nombre de lignes par page" }),
		).toBeInTheDocument();
	});

	it("does not show pagination when all rows fit in one page", () => {
		renderSection();
		expect(
			screen.queryByRole("navigation", { name: "Pagination" }),
		).not.toBeInTheDocument();
	});

	it("shows pagination and navigates pages when rows exceed page size", () => {
		const manyDeclarations: DeclarationItem[] = Array.from(
			{ length: 15 },
			(_, i) => ({
				type: "remuneration" as const,
				siren: "532847196",
				year: currentYear - i,
				status: "done" as const,
				currentStep: 6,
				updatedAt: new Date("2025-01-01"),
			}),
		);

		renderSection({ declarations: manyDeclarations });

		const pagination = screen.getByRole("navigation", { name: "Pagination" });
		expect(pagination).toBeInTheDocument();

		// Page 1: 1 header + 10 visible entries (1 current + 1 separator + 8 previous)
		expect(screen.getAllByRole("row")).toHaveLength(1 + 10);

		// Navigate to page 2
		fireEvent.click(screen.getByTitle("Page 2"));
		// Page 2 shows remaining rows
		expect(screen.getAllByRole("row").length).toBeLessThan(12);
	});

	it("navigates to next, previous, first and last page", () => {
		const manyDeclarations: DeclarationItem[] = Array.from(
			{ length: 25 },
			(_, i) => ({
				type: "remuneration" as const,
				siren: "532847196",
				year: currentYear - i,
				status: "done" as const,
				currentStep: 6,
				updatedAt: new Date("2025-01-01"),
			}),
		);

		renderSection({ declarations: manyDeclarations });

		// Navigate to page 2 via "Page suivante"
		fireEvent.click(screen.getByTitle("Page suivante"));
		expect(
			screen.getByRole("button", { name: "2", current: "page" }),
		).toBeInTheDocument();

		// Navigate to last page via "Dernière page"
		fireEvent.click(screen.getByTitle("Dernière page"));
		expect(
			screen.getByRole("button", { name: "3", current: "page" }),
		).toBeInTheDocument();

		// Navigate to previous page via "Page précédente"
		fireEvent.click(screen.getByTitle("Page précédente"));
		expect(
			screen.getByRole("button", { name: "2", current: "page" }),
		).toBeInTheDocument();

		// Navigate to first page via "Première page"
		fireEvent.click(screen.getByTitle("Première page"));
		expect(
			screen.getByRole("button", { name: "1", current: "page" }),
		).toBeInTheDocument();
	});

	it("renders ellipsis when there are many pages", () => {
		const manyDeclarations: DeclarationItem[] = Array.from(
			{ length: 80 },
			(_, i) => ({
				type: "remuneration" as const,
				siren: "532847196",
				year: currentYear - i,
				status: "done" as const,
				currentStep: 6,
				updatedAt: new Date("2025-01-01"),
			}),
		);

		renderSection({ declarations: manyDeclarations });

		// With 80+ rows and page size 10, we get 9 pages
		// On page 1, only end ellipsis is shown
		expect(screen.getAllByText("…")).toHaveLength(1);

		// Navigate to middle page using "Page suivante" repeatedly
		fireEvent.click(screen.getByTitle("Page suivante")); // page 2
		fireEvent.click(screen.getByTitle("Page suivante")); // page 3
		fireEvent.click(screen.getByTitle("Page suivante")); // page 4
		fireEvent.click(screen.getByTitle("Page suivante")); // page 5
		// Now on page 5 of 9, both ellipses should be visible
		expect(screen.getAllByText("…")).toHaveLength(2);
	});

	it("resets to page 1 when page size changes", () => {
		const manyDeclarations: DeclarationItem[] = Array.from(
			{ length: 15 },
			(_, i) => ({
				type: "remuneration" as const,
				siren: "532847196",
				year: currentYear - i,
				status: "done" as const,
				currentStep: 6,
				updatedAt: new Date("2025-01-01"),
			}),
		);

		renderSection({ declarations: manyDeclarations });

		// Go to page 2
		fireEvent.click(screen.getByTitle("Page 2"));

		// Change page size to 25
		fireEvent.change(
			screen.getByRole("combobox", { name: "Nombre de lignes par page" }),
			{ target: { value: "25" } },
		);

		// Should be back on page 1 with all rows visible, no pagination
		expect(
			screen.queryByRole("navigation", { name: "Pagination" }),
		).not.toBeInTheDocument();
	});
});
