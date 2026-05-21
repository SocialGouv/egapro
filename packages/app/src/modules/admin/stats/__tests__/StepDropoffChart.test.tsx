import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepDropoffChart } from "../StepDropoffChart";
import type { StepDropoffRow } from "../types";

const EMPTY_ROWS: StepDropoffRow[] = [
	{
		step: 0,
		label: "Introduction",
		total: 0,
		abandoned: 0,
		dropoffRate: 0,
	},
];

const POPULATED_ROWS: StepDropoffRow[] = [
	{
		step: 0,
		label: "Introduction",
		total: 100,
		abandoned: 5,
		dropoffRate: 5,
	},
	{
		step: 1,
		label: "Effectifs",
		total: 80,
		abandoned: 20,
		dropoffRate: 25,
	},
	{
		step: 2,
		label: "Écart de rémunération",
		total: 60,
		abandoned: 6,
		dropoffRate: 10,
	},
];

describe("StepDropoffChart", () => {
	it("renders an empty-state message when no row has any data", () => {
		render(<StepDropoffChart rows={EMPTY_ROWS} />);
		expect(screen.getByText(/Aucune donnée/i)).toBeInTheDocument();
	});

	it("renders an accessible figcaption when rows have data", () => {
		render(<StepDropoffChart rows={POPULATED_ROWS} />);
		expect(
			screen.getByText(/Taux d'abandon par étape du parcours indicateurs/i),
		).toBeInTheDocument();
	});

	it("mentions the alert threshold in the figcaption", () => {
		render(<StepDropoffChart rows={POPULATED_ROWS} />);
		expect(
			screen.getByText(
				/barres rouges signalent une étape dont le taux dépasse 15/i,
			),
		).toBeInTheDocument();
	});
});
