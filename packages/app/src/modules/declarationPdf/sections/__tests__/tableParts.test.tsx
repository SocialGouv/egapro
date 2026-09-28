import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	return {
		Text: ({ children }: { children: React.ReactNode }) =>
			React.createElement("span", null, children),
		View: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

import { Cell, Row, Table } from "../tableParts";

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
});
