import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepDurationsChart } from "../StepDurationsChart";
import type { StepDurationRow } from "../types";

const EMPTY_ROWS: StepDurationRow[] = [
	{
		key: "step_0",
		phase: "wizard",
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
		key: "step_1",
		phase: "wizard",
		step: 1,
		label: "Effectifs",
		sampleSize: 10,
		completedSampleSize: 10,
		medianDays: 5.5,
		p90Days: 9.1,
	},
	{
		key: "step_2",
		phase: "wizard",
		step: 2,
		label: "Écart de rémunération",
		sampleSize: 8,
		completedSampleSize: 7,
		medianDays: 2.0,
		p90Days: 6.4,
	},
	{
		key: "submit_to_path_choice",
		phase: "post_submit",
		step: null,
		label: "Soumission → choix conformité",
		sampleSize: 6,
		completedSampleSize: 6,
		medianDays: 3.2,
		p90Days: 8.4,
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

	it("mentions the post-soumission phase in the figcaption", () => {
		render(<StepDurationsChart rows={POPULATED_ROWS} />);
		expect(
			screen.getByText(/jalon de la démarche post-soumission/i),
		).toBeInTheDocument();
	});
});
