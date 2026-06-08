import { describe, expect, it } from "vitest";

import { buildMatomoFunnelRows } from "../MatomoFunnelChart";

describe("buildMatomoFunnelRows", () => {
	it("builds Entrées → steps → Complétions rows with funnel percentages", () => {
		const rows = buildMatomoFunnelRows({
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
					avgDurationSeconds: 30,
				},
			],
		});

		expect(rows).toEqual([
			{
				key: "funnel_start",
				label: "Entrées",
				count: 1000,
				pctOfStart: 100,
				pctDropFromPrev: null,
			},
			{
				key: "step_1",
				label: "Effectifs",
				count: 900,
				pctOfStart: 90,
				pctDropFromPrev: 10,
			},
			{
				key: "step_2",
				label: "Écart de rémunération",
				count: 700,
				pctOfStart: 70,
				pctDropFromPrev: 22,
			},
			{
				key: "funnel_complete",
				label: "Complétions",
				count: 400,
				pctOfStart: 40,
				pctDropFromPrev: 43,
			},
		]);
	});

	it("returns zero percentages and no drop when there are no entries", () => {
		const rows = buildMatomoFunnelRows({
			startedCount: 0,
			completedCount: 0,
			abandonedCount: 0,
			steps: [],
		});

		expect(rows).toEqual([
			{
				key: "funnel_start",
				label: "Entrées",
				count: 0,
				pctOfStart: 0,
				pctDropFromPrev: null,
			},
			{
				key: "funnel_complete",
				label: "Complétions",
				count: 0,
				pctOfStart: 0,
				pctDropFromPrev: null,
			},
		]);
	});
});
