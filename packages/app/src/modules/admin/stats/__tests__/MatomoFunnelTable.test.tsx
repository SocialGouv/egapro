import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MatomoFunnelTable } from "../MatomoFunnelTable";

const DATA = {
	startedCount: 1000,
	completedCount: 400,
	abandonedCount: 600,
	steps: [
		{
			stepKey: "step_1",
			label: "Effectifs",
			completedCount: 900,
			avgDurationSeconds: 12,
		},
		{
			stepKey: "step_2",
			label: "Écart de rémunération",
			completedCount: 700,
			avgDurationSeconds: null,
		},
	],
};

describe("MatomoFunnelTable", () => {
	it("renders the funnel bounds, per-step counts and durations", () => {
		render(<MatomoFunnelTable caption="Funnel Matomo" data={DATA} />);

		expect(screen.getByText("Entrées")).toBeInTheDocument();
		expect(screen.getByText("Complétions")).toBeInTheDocument();
		expect(screen.getByText("Abandons")).toBeInTheDocument();
		expect(screen.getByText("Effectifs")).toBeInTheDocument();
		expect(screen.getByText("Écart de rémunération")).toBeInTheDocument();

		const stepRow = screen.getByText("Effectifs").closest("tr");
		expect(stepRow).not.toBeNull();
		expect(stepRow).toHaveTextContent("900");
		expect(stepRow).toHaveTextContent("12");

		const nullDurationRow = screen
			.getByText("Écart de rémunération")
			.closest("tr");
		expect(nullDurationRow).toHaveTextContent("—");
	});

	it("provides an accessible caption", () => {
		render(<MatomoFunnelTable caption="Funnel Matomo" data={DATA} />);
		expect(
			screen.getByRole("table", { name: "Funnel Matomo" }),
		).toBeInTheDocument();
	});
});
