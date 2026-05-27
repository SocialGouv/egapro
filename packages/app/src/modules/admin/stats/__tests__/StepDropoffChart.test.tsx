import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepDropoffChart } from "../StepDropoffChart";
import type { StepDropoffRow } from "../types";

const EMPTY_ROWS: StepDropoffRow[] = [
	{
		key: "0",
		phase: "wizard",
		step: 0,
		label: "Introduction",
		total: 0,
		abandoned: 0,
		dropoffRate: 0,
	},
];

const POPULATED_ROWS: StepDropoffRow[] = [
	{
		key: "0",
		phase: "wizard",
		step: 0,
		label: "Introduction",
		total: 100,
		abandoned: 5,
		dropoffRate: 5,
	},
	{
		key: "1",
		phase: "wizard",
		step: 1,
		label: "Effectifs",
		total: 80,
		abandoned: 20,
		dropoffRate: 25,
	},
	{
		key: "2",
		phase: "wizard",
		step: 2,
		label: "Écart de rémunération",
		total: 60,
		abandoned: 6,
		dropoffRate: 10,
	},
	{
		key: "awaiting_compliance_path_choice",
		phase: "post_submit",
		step: null,
		label: "Choix parcours conformité",
		total: 30,
		abandoned: 9,
		dropoffRate: 30,
	},
];

describe("StepDropoffChart", () => {
	it("renders an empty-state message when no row has any data", () => {
		render(<StepDropoffChart rows={EMPTY_ROWS} />);
		expect(screen.getByText(/Aucune donnée/i)).toBeInTheDocument();
	});

	it("renders an accessible figcaption that covers both wizard and post-submit phases", () => {
		render(<StepDropoffChart rows={POPULATED_ROWS} />);
		expect(
			screen.getByText(/Taux d'abandon par phase de la démarche déclarative/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/wizard ou phase post-soumission/i),
		).toBeInTheDocument();
	});

	it("mentions the alert threshold in the figcaption", () => {
		render(<StepDropoffChart rows={POPULATED_ROWS} />);
		expect(
			screen.getByText(
				/barres rouges signalent une phase dont le taux dépasse 15/i,
			),
		).toBeInTheDocument();
	});
});
