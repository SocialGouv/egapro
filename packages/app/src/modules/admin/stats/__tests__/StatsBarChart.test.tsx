import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type BarSeries, StatsBarChart } from "../StatsBarChart";

type LabeledRow = { key: string; label: string; count: number };

type DeviceRow = {
	key: string;
	label: string;
	desktop: number;
	smartphone: number;
	tablet: number;
};

const SINGLE_SERIES: BarSeries<LabeledRow>[] = [
	{ key: "count", name: "Clics", color: "var(--blue-france-sun-113-625)" },
];

const MULTI_SERIES: BarSeries<DeviceRow>[] = [
	{
		key: "desktop",
		name: "Ordinateur",
		color: "var(--blue-france-sun-113-625)",
	},
	{
		key: "smartphone",
		name: "Smartphone",
		color: "var(--green-emeraude-main-632)",
	},
	{ key: "tablet", name: "Tablette", color: "var(--purple-glycine-main-494)" },
];

const POPULATED_DEVICE_ROWS: DeviceRow[] = [
	{
		key: "modification",
		label: "Modification (déclaration)",
		desktop: 30,
		smartphone: 12,
		tablet: 3,
	},
];

const ZERO_ROWS: LabeledRow[] = [
	{ key: "cse_models", label: "Modèles d'avis CSE", count: 0 },
	{ key: "objective_criteria", label: "Critères objectifs", count: 0 },
];

const POPULATED_ROWS: LabeledRow[] = [
	{ key: "cse_models", label: "Modèles d'avis CSE", count: 50 },
	{ key: "objective_criteria", label: "Critères objectifs", count: 30 },
];

describe("StatsBarChart", () => {
	it("renders the empty-state message when every series value is 0", () => {
		render(
			<StatsBarChart
				caption="Clics sur les liens d'aide"
				data={ZERO_ROWS}
				series={SINGLE_SERIES}
				valueAxisLabel="Nombre de clics"
			/>,
		);
		expect(screen.getByText(/Aucune donnée/i)).toBeInTheDocument();
	});

	it("treats a row missing the series value as empty (defensive nullish guard)", () => {
		const rowsMissingValue = [
			{ key: "cse_models", label: "Modèles d'avis CSE" },
		] as unknown as LabeledRow[];
		render(
			<StatsBarChart
				caption="Clics sur les liens d'aide"
				data={rowsMissingValue}
				series={SINGLE_SERIES}
				valueAxisLabel="Nombre de clics"
			/>,
		);
		expect(screen.getByText(/Aucune donnée/i)).toBeInTheDocument();
	});

	it("uses a custom empty label when provided", () => {
		render(
			<StatsBarChart
				caption="Clics sur les liens d'aide"
				data={ZERO_ROWS}
				emptyLabel="Rien à afficher pour l'instant."
				series={SINGLE_SERIES}
				valueAxisLabel="Nombre de clics"
			/>,
		);
		expect(
			screen.getByText("Rien à afficher pour l'instant."),
		).toBeInTheDocument();
	});

	it("renders an accessible figure with the caption when at least one value is positive", () => {
		render(
			<StatsBarChart
				caption="Clics sur les liens d'aide"
				data={POPULATED_ROWS}
				series={SINGLE_SERIES}
				valueAxisLabel="Nombre de clics"
			/>,
		);
		expect(screen.queryByText(/Aucune donnée/i)).not.toBeInTheDocument();
		expect(
			screen.getByRole("img", { name: "Clics sur les liens d'aide" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Les données équivalentes sont disponibles/),
		).toBeInTheDocument();
	});

	it("renders the figure for a populated multi-series (device) dataset", () => {
		render(
			<StatsBarChart
				caption="Répartition par appareil"
				data={POPULATED_DEVICE_ROWS}
				series={MULTI_SERIES}
				valueAxisLabel="Nombre de visites"
			/>,
		);
		expect(screen.queryByText(/Aucune donnée/i)).not.toBeInTheDocument();
		expect(
			screen.getByRole("img", { name: "Répartition par appareil" }),
		).toBeInTheDocument();
	});
});
