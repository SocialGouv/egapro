import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", async () => {
	const actual =
		await vi.importActual<typeof import("next/navigation")>("next/navigation");
	return {
		...actual,
		useRouter: () => ({
			push: mockPush,
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
	demarcheStatus: "in_progress",
	lastTransmittedStep: "Transmission de la déclaration",
	nextStep: "Choix du parcours de mise en conformité",
	statusDate: new Date("2024-06-20T10:00:00Z"),
};

const defaultProps = {
	rows: [baseRow],
	total: 1,
	page: 1,
	totalPages: 1,
	sortBy: "statusDate",
	sortOrder: "desc",
};

const HELP_COLUMNS = [
	"Statut de la démarche",
	"Dernière étape transmise",
	"Prochaine étape",
	"Date",
];

function headerTexts(): string[] {
	return screen.getAllByRole("columnheader").map((header) => {
		const control = header.querySelector("button:not(.fr-btn--tooltip), span");
		return control?.textContent?.replace(/[▲▼\s]+$/, "") ?? "";
	});
}

describe("DeclarationTable", () => {
	it("renders rows with company name as link", () => {
		render(<DeclarationTable {...defaultProps} />);

		expect(screen.getByText("ACME Corp")).toBeInTheDocument();
		expect(screen.getByText("ACME Corp").closest("a")).toHaveAttribute(
			"href",
			`/admin/declarations/${baseRow.id}`,
		);
	});

	it("shows SIREN, year, workforce, démarche status, both steps, email and the status date", () => {
		render(<DeclarationTable {...defaultProps} />);

		const cells = screen.getAllByRole("cell").map((cell) => cell.textContent);
		expect(cells).toEqual([
			"123456789",
			"ACME Corp",
			"2024",
			"99",
			"En cours",
			"Transmission de la déclaration",
			"Choix du parcours de mise en conformité",
			"alice@example.com",
			"20/06/2024",
		]);
	});

	it("orders the columns with the three démarche columns after the workforce and the date last", () => {
		render(<DeclarationTable {...defaultProps} />);

		expect(headerTexts()).toEqual([
			"SIREN",
			"Entreprise",
			"Année",
			"Effectif annuel moyen",
			"Statut de la démarche",
			"Dernière étape transmise",
			"Prochaine étape",
			"Email déclarant",
			"Date",
		]);
	});

	it("shows a dash for a step or a date the démarche does not have", () => {
		render(
			<DeclarationTable
				{...defaultProps}
				rows={[
					{
						...baseRow,
						demarcheStatus: "completed",
						lastTransmittedStep: null,
						nextStep: null,
						statusDate: null,
					},
				]}
			/>,
		);

		const cells = screen.getAllByRole("cell").map((cell) => cell.textContent);
		expect(cells[5]).toBe("—");
		expect(cells[6]).toBe("—");
		expect(cells[8]).toBe("—");
	});

	it("puts a single sort button in each sortable header and none in the two step headers", () => {
		render(<DeclarationTable {...defaultProps} />);

		const headers = screen.getAllByRole("columnheader");
		const sortButtonCounts = headers.map(
			(header) =>
				header.querySelectorAll("button:not(.fr-btn--tooltip)").length,
		);
		expect(sortButtonCounts).toEqual([1, 1, 1, 1, 1, 0, 0, 1, 1]);
		expect(headers[5]).not.toHaveAttribute("aria-sort");
		expect(headers[6]).not.toHaveAttribute("aria-sort");
	});

	it.each(
		HELP_COLUMNS,
	)("gives the « %s » header its own help button, beside the sort control and never inside it", (label) => {
		render(<DeclarationTable {...defaultProps} />);

		const help = screen.getByRole("button", {
			name: `Aide sur la colonne ${label}`,
		});
		expect(help.closest("th")).not.toBeNull();
		expect(help.parentElement?.closest("button")).toBeNull();
		expect(help.querySelector("button")).toBeNull();
		const tooltipId = help.getAttribute("aria-describedby");
		expect(tooltipId).toMatch(/^tooltip-admin-declarations-/);
		expect(document.getElementById(tooltipId ?? "")).toHaveAttribute(
			"role",
			"tooltip",
		);
	});

	it("gives help buttons unique tooltip ids and leaves the other headers without one", () => {
		render(<DeclarationTable {...defaultProps} />);

		const helpButtons = document.querySelectorAll("th .fr-btn--tooltip");
		const ids = Array.from(helpButtons).map((button) =>
			button.getAttribute("aria-describedby"),
		);
		expect(ids).toHaveLength(HELP_COLUMNS.length);
		expect(new Set(ids).size).toBe(HELP_COLUMNS.length);
	});

	it("explains the date rule in the Date tooltip", () => {
		render(<DeclarationTable {...defaultProps} />);

		const help = screen.getByRole("button", {
			name: "Aide sur la colonne Date",
		});
		const tooltip = document.getElementById(
			help.getAttribute("aria-describedby") ?? "",
		);
		expect(tooltip).toHaveTextContent(
			"Brouillon : date d'ouverture de la démarche. En cours : date de la dernière étape transmise. Finalisée : date de finalisation. Annulée : date d'annulation.",
		);
	});

	it("does not sort when the help button is activated", async () => {
		const user = userEvent.setup();
		mockPush.mockClear();
		render(<DeclarationTable {...defaultProps} />);

		await user.click(
			screen.getByRole("button", { name: "Aide sur la colonne Date" }),
		);

		expect(mockPush).not.toHaveBeenCalled();
	});

	it("sorts by démarche status through the status header button", async () => {
		const user = userEvent.setup();
		const scrollTo = vi
			.spyOn(window, "scrollTo")
			.mockImplementation(() => undefined);
		mockPush.mockClear();
		render(<DeclarationTable {...defaultProps} />);

		await user.click(
			screen.getByRole("button", { name: /^Statut de la démarche/ }),
		);

		expect(mockPush).toHaveBeenCalledWith(
			expect.stringContaining("sortBy=demarcheStatus"),
		);
		scrollTo.mockRestore();
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
		expect(caption?.textContent).toContain("effectif annuel moyen");
		expect(caption?.textContent).toContain("GIP-MDS");
	});

	it("exposes aria-sort on the sorted column and hides the sort glyph", () => {
		render(<DeclarationTable {...defaultProps} />);

		const sortedHeader = screen
			.getByRole("button", { name: /^date/i })
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

	it("keeps keyboard focus on « Première page » once the first page is shown", async () => {
		const user = userEvent.setup();
		const scrollTo = vi
			.spyOn(window, "scrollTo")
			.mockImplementation(() => undefined);
		mockPush.mockClear();
		const { rerender } = render(
			<DeclarationTable {...defaultProps} page={2} totalPages={3} />,
		);
		const first = screen.getByRole("button", { name: "Première page" });
		first.focus();

		await user.keyboard("{Enter}");
		expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));

		rerender(<DeclarationTable {...defaultProps} page={1} totalPages={3} />);
		expect(first).toHaveAttribute("aria-disabled", "true");
		expect(first).toBeEnabled();
		expect(first).toHaveFocus();

		mockPush.mockClear();
		await user.keyboard("{Enter}");
		expect(mockPush).not.toHaveBeenCalled();
		scrollTo.mockRestore();
	});

	it.each([
		{ demarcheStatus: "draft", label: "Brouillon", modifier: null },
		{
			demarcheStatus: "in_progress",
			label: "En cours",
			modifier: "fr-badge--info",
		},
		{
			demarcheStatus: "completed",
			label: "Finalisée",
			modifier: "fr-badge--success",
		},
		{
			demarcheStatus: "cancelled",
			label: "Annulée",
			modifier: "fr-badge--warning",
		},
	] as const)("shows the $label démarche status as a small badge", ({
		demarcheStatus,
		label,
		modifier,
	}) => {
		render(
			<DeclarationTable
				{...defaultProps}
				rows={[{ ...baseRow, demarcheStatus }]}
			/>,
		);

		const cell = screen.getAllByRole("cell")[4] as HTMLElement;
		const badge = within(cell).getByText(label);
		expect(badge).toHaveClass("fr-badge", "fr-badge--sm", "fr-badge--no-icon");
		const colorModifiers = Array.from(badge.classList).filter((name) =>
			/^fr-badge--(info|success|warning|error|new)$/.test(name),
		);
		expect(colorModifiers).toEqual(modifier ? [modifier] : []);
	});

	it("keeps the full company name as the link's accessible name and applies the visual truncation class", () => {
		const longName =
			"Société Démo des Établissements Industriels et Commerciaux Réunis de la Région Centre-Val de Loire";
		render(
			<DeclarationTable
				{...defaultProps}
				rows={[{ ...baseRow, companyName: longName }]}
			/>,
		);

		const link = screen.getByRole("link", { name: longName });
		expect(link).toHaveClass("companyLink");
	});

	it("renders a short company name as the full link text", () => {
		render(<DeclarationTable {...defaultProps} />);

		const link = screen.getByRole("link", { name: "ACME Corp" });
		expect(link).toHaveTextContent(/^ACME Corp$/);
	});
});
