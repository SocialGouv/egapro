import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuartileColumn } from "../QuartileColumn";

describe("QuartileColumn", () => {
	it("S1: writes a quartile share with the French decimal comma", () => {
		render(
			<QuartileColumn
				quartiles={[{ label: "Q1", womenCount: 1, menCount: 7 }]}
				title="Rémunération annuelle"
			/>,
		);

		expect(screen.getByText("12,5 %")).toBeInTheDocument();
		expect(screen.getByText("87,5 %")).toBeInTheDocument();
		expect(screen.queryByText("12.5 %")).not.toBeInTheDocument();
	});

	it("S2: reads an empty quartile as a nil share, never as a missing one", () => {
		render(
			<QuartileColumn
				quartiles={[{ label: "Q1", womenCount: 0, menCount: 0 }]}
				title="Rémunération annuelle"
			/>,
		);

		expect(screen.getAllByText("0,0 %")).toHaveLength(2);
		expect(screen.queryByText("- %")).not.toBeInTheDocument();
	});

	it("labels both halves of the column and every quartile row", () => {
		render(
			<QuartileColumn
				quartiles={[
					{ label: "Q1", womenCount: 1, menCount: 1 },
					{ label: "Q2", womenCount: 3, menCount: 1 },
				]}
				title="Rémunération horaire"
			/>,
		);

		expect(screen.getByText("Rémunération horaire")).toBeInTheDocument();
		expect(screen.getByText("Pourcentage de femmes")).toBeInTheDocument();
		expect(screen.getByText("Pourcentage d'hommes")).toBeInTheDocument();
		expect(screen.getAllByText("Q1")).toHaveLength(2);
		expect(screen.getAllByText("50,0 %")).toHaveLength(2);
		expect(screen.getByText("75,0 %")).toBeInTheDocument();
		expect(screen.getByText("25,0 %")).toBeInTheDocument();
	});
});
