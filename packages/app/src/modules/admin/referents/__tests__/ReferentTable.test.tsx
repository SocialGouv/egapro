import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerPush = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", async () => {
	const actual =
		await vi.importActual<typeof import("next/navigation")>("next/navigation");
	return {
		...actual,
		useRouter: () => ({ push: routerPush }),
		useSearchParams: () => currentSearchParams,
	};
});

import { ReferentTable } from "../ReferentTable";
import type { ReferentSearchRow } from "../types";

const baseRow: ReferentSearchRow = {
	id: "ref-1",
	region: "11",
	county: "75",
	name: "Jean DUPONT",
	type: "email",
	value: "jean@gouv.fr",
	principal: true,
	substituteName: "Marie MARTIN",
	substituteEmail: "marie@gouv.fr",
	createdAt: new Date("2024-06-15T10:00:00Z"),
};

function renderTable(
	overrides: Partial<Parameters<typeof ReferentTable>[0]> = {},
) {
	const onEdit = vi.fn();
	const onSelectionChange = vi.fn();
	render(
		<ReferentTable
			onEdit={onEdit}
			onSelectionChange={onSelectionChange}
			page={1}
			rows={[baseRow]}
			selectedIds={new Set()}
			sortBy="region"
			sortOrder="asc"
			total={1}
			totalPages={1}
			{...overrides}
		/>,
	);
	return { onEdit, onSelectionChange };
}

describe("ReferentTable", () => {
	beforeEach(() => {
		routerPush.mockClear();
		currentSearchParams = new URLSearchParams();
	});

	it("renders rows with region, county and value", () => {
		renderTable();
		expect(screen.getByText("Jean DUPONT")).toBeInTheDocument();
		expect(screen.getByText("jean@gouv.fr")).toBeInTheDocument();
		expect(screen.getByText("Marie MARTIN")).toBeInTheDocument();
	});

	it("renders an empty state when there are no rows", () => {
		renderTable({ rows: [], total: 0 });
		expect(screen.getByText("Aucun référent trouvé.")).toBeInTheDocument();
	});

	it("toggles a row selection when its checkbox is clicked", () => {
		const { onSelectionChange } = renderTable();
		fireEvent.click(screen.getByLabelText(/Sélectionner Jean DUPONT/));
		const selected = onSelectionChange.mock.calls[0]?.[0] as Set<string>;
		expect(selected.has("ref-1")).toBe(true);
	});

	it("unselects when clicking an already-selected row", () => {
		const { onSelectionChange } = renderTable({
			selectedIds: new Set(["ref-1"]),
		});
		fireEvent.click(screen.getByLabelText(/Sélectionner Jean DUPONT/));
		const selected = onSelectionChange.mock.calls[0]?.[0] as Set<string>;
		expect(selected.has("ref-1")).toBe(false);
	});

	it("flips sort order when clicking the active sort column", () => {
		renderTable({ sortBy: "region", sortOrder: "asc" });
		fireEvent.click(screen.getByRole("button", { name: /Région/ }));
		expect(routerPush).toHaveBeenCalledWith(
			expect.stringMatching(/sortOrder=desc/),
		);
	});

	it("switches sort column on inactive column click", () => {
		renderTable({ sortBy: "region", sortOrder: "asc" });
		fireEvent.click(screen.getByRole("button", { name: "Nom" }));
		expect(routerPush).toHaveBeenCalledWith(
			expect.stringMatching(/sortBy=name/),
		);
		expect(routerPush).toHaveBeenCalledWith(
			expect.stringMatching(/sortOrder=asc/),
		);
	});

	it("shows pagination when totalPages > 1 and navigates", () => {
		renderTable({ page: 2, totalPages: 3 });
		fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
		expect(routerPush).toHaveBeenCalledWith(expect.stringMatching(/page=3/));
		fireEvent.click(screen.getByRole("button", { name: "Précédent" }));
		expect(routerPush).toHaveBeenCalledWith(expect.stringMatching(/page=1/));
	});

	it("calls onEdit when clicking Modifier", () => {
		const { onEdit } = renderTable();
		fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
		expect(onEdit).toHaveBeenCalledWith(baseRow);
	});

	it("handles rows without a county", () => {
		renderTable({
			rows: [{ ...baseRow, county: null }],
		});
		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("handles URL type referents", () => {
		renderTable({
			rows: [
				{
					...baseRow,
					type: "url",
					value: "https://gouv.fr",
					substituteName: null,
					substituteEmail: null,
				},
			],
		});
		const link = screen.getByRole("link", { name: /https:\/\/gouv\.fr/ });
		expect(link).toHaveAttribute("href", "https://gouv.fr");
	});
});
