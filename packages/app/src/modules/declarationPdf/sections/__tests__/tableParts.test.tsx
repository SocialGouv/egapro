import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	return {
		Text: ({ children }: { children: React.ReactNode }) =>
			React.createElement("span", null, children),
		View: ({
			children,
			"data-pdf-structure": structure,
		}: {
			children: React.ReactNode;
			"data-pdf-structure"?: unknown;
		}) =>
			React.createElement(
				"div",
				{ "data-structure": JSON.stringify(structure ?? null) },
				children,
			),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

import { Cell, normalizePdfText, Row, Table } from "../tableParts";

function structureOf(element: HTMLElement | null) {
	return JSON.parse(element?.getAttribute("data-structure") ?? "null");
}

describe("tableParts", () => {
	it("renders a width-less cell using the flex default", () => {
		render(
			<Table>
				<Row>
					<Cell text="stretchy" />
				</Row>
			</Table>,
		);
		expect(screen.getByText("stretchy")).toBeInTheDocument();
	});

	it("renders header hint and child content", () => {
		render(
			<Table>
				<Row>
					<Cell
						header
						hint="Seuil réglementaire : 5%"
						text="Écart"
						width={100}
					/>
					<Cell width={80}>
						<span>nested</span>
					</Cell>
				</Row>
			</Table>,
		);
		expect(screen.getByText("Seuil réglementaire : 5%")).toBeInTheDocument();
		expect(screen.getByText("nested")).toBeInTheDocument();
	});

	it("tags the grid as a table of rows, and each cell as a header or data cell", () => {
		const { container } = render(
			<Table>
				<Row>
					<Cell header width={100} />
					<Cell columnSpan={2} header text="Tranches" />
				</Row>
				<Row>
					<Cell rowHeader text="Tous les salariés" />
					<Cell text="42" />
				</Row>
			</Table>,
		);
		const table = container.firstElementChild as HTMLElement;
		const [headerRow, bodyRow] = Array.from(table.children) as HTMLElement[];

		expect(structureOf(table)).toEqual({ tag: "Table" });
		expect(structureOf(headerRow ?? null)).toEqual({ tag: "TR" });
		expect(
			Array.from(headerRow?.children ?? []).map((cell) =>
				structureOf(cell as HTMLElement),
			),
		).toEqual([{ tag: "TD" }, { tag: "TH", scope: "Column", columnSpan: 2 }]);
		expect(
			structureOf(screen.getByText("Tous les salariés").parentElement),
		).toEqual({
			tag: "TH",
			scope: "Row",
		});
		expect(structureOf(screen.getByText("42").parentElement)).toEqual({
			tag: "TD",
		});
		expect(bodyRow).toBeDefined();
	});

	it("swaps characters Marianne cannot draw for ones it can", () => {
		expect(normalizePdfText("12\u202F345\u00A0€")).toBe("12\u00A0345\u00A0€");
		expect(normalizePdfText("déposé le 1ᵉʳ avril 2027")).toBe(
			"déposé le 1er avril 2027",
		);
	});
});
