import type { ReactElement } from "react";
import { afterEach, beforeEach, vi } from "vitest";

import { CampaignProgressionChart } from "~/modules/admin/stats/CampaignProgressionChart";
import { StatsBarChart } from "~/modules/admin/stats/StatsBarChart";
import { StepDropoffChart } from "~/modules/admin/stats/StepDropoffChart";
import { StepDurationsChart } from "~/modules/admin/stats/StepDurationsChart";

export const CHART_WIDTH = 640;
export const CHART_HEIGHT = 360;

const CHART_BOX = {
	x: 0,
	y: 0,
	top: 0,
	left: 0,
	right: CHART_WIDTH,
	bottom: CHART_HEIGHT,
	width: CHART_WIDTH,
	height: CHART_HEIGHT,
	toJSON: () => ({}),
} as DOMRect;

class FixedSizeResizeObserver implements ResizeObserver {
	constructor(private readonly callback: ResizeObserverCallback) {}

	observe(target: Element) {
		this.callback(
			[{ target, contentRect: CHART_BOX } as ResizeObserverEntry],
			this,
		);
	}

	unobserve() {}

	disconnect() {}
}

// jsdom has no layout: without a measurable box ResponsiveContainer never mounts the Recharts SVG.
export function withMeasurableChartLayout() {
	beforeEach(() => {
		const measure = HTMLElement.prototype.getBoundingClientRect;
		vi.stubGlobal("ResizeObserver", FixedSizeResizeObserver);
		vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
			function (this: HTMLElement) {
				return this.classList.contains("recharts-responsive-container")
					? CHART_BOX
					: measure.call(this);
			},
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});
}

type DeviceRow = {
	key: string;
	label: string;
	desktop: number;
	smartphone: number;
};

export type RenderedChart = {
	name: string;
	element: ReactElement;
};

export const RENDERED_CHARTS: RenderedChart[] = [
	{
		name: "CampaignProgressionChart",
		element: (
			<CampaignProgressionChart
				currentYear={2026}
				series={[
					{
						year: 2025,
						points: [
							{ day: "2025-02-10", cumulative: 40 },
							{ day: "2025-02-15", cumulative: 200 },
						],
					},
					{
						year: 2026,
						points: [
							{ day: "2026-02-10", cumulative: 30 },
							{ day: "2026-02-15", cumulative: 180 },
						],
					},
				]}
			/>
		),
	},
	{
		name: "StepDurationsChart",
		element: (
			<StepDurationsChart
				rows={[
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
						key: "cse_opinion",
						phase: "post_submit",
						step: null,
						label: "Avis du CSE",
						sampleSize: 4,
						completedSampleSize: 3,
						medianDays: 12,
						p90Days: 20,
					},
				]}
			/>
		),
	},
	{
		name: "StepDropoffChart",
		element: (
			<StepDropoffChart
				rows={[
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
						key: "compliance",
						phase: "post_submit",
						step: null,
						label: "Parcours de conformité",
						total: 40,
						abandoned: 20,
						dropoffRate: 50,
					},
				]}
			/>
		),
	},
	{
		name: "StatsBarChart",
		element: (
			<StatsBarChart<DeviceRow>
				caption="Répartition par type d'appareil"
				data={[
					{
						key: "modification",
						label: "Modification (déclaration)",
						desktop: 30,
						smartphone: 12,
					},
				]}
				series={[
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
				]}
				valueAxisLabel="Visites"
			/>
		),
	},
];
