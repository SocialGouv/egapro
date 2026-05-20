import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepDurationsChart } from "../StepDurationsChart";
import type { StepDurationRow } from "../types";

const EMPTY_ROWS: StepDurationRow[] = [
	{
		step: 0,
		label: "Introduction",
		sampleSize: 0,
		completedSampleSize: 0,
		medianDays: null,
		p90Days: null,
	},
];

const POPULATED_ROWS: StepDurationRow[] = [
	{
		step: 1,
		label: "Effectifs",
		sampleSize: 10,
		completedSampleSize: 10,
		medianDays: 5.5,
		p90Days: 9.1,
	},
	{
		step: 2,
		label: "Écart de rémunération",
		sampleSize: 8,
		completedSampleSize: 7,
		medianDays: 2.0,
		p90Days: 6.4,
	},
];

describe("StepDurationsChart", () => {
	it("shows an empty-state message when no row has any duration data", () => {
		render(<StepDurationsChart rows={EMPTY_ROWS} />);
		expect(screen.getByText(/Aucune donnée/)).toBeInTheDocument();
	});

	it("includes an accessible figcaption when rows have durations", () => {
		render(<StepDurationsChart rows={POPULATED_ROWS} />);
		expect(
			screen.getByText(/Délai médian et 90e percentile/),
		).toBeInTheDocument();
	});
});
