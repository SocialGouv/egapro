import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		MATOMO_API_TOKEN: "secret-token" as string | undefined,
		MATOMO_API_URL: "https://matomo.test" as string | undefined,
		NEXT_PUBLIC_MATOMO_URL: "https://matomo.test" as string | undefined,
		NEXT_PUBLIC_MATOMO_SITE_ID: "1" as string | undefined,
	},
}));

vi.mock("~/env", () => ({ env: mockEnv }));

import { fetchMatomoFunnel } from "../matomo";

type Row = { label: string; nb_events?: number; idsubdatatable?: number };

// Subtable ids: category → its action subtable; the step_complete action of
// each category → its name subtable (`<categorySubtable> + 1`).
function eventsApiResponder(init: { body: URLSearchParams }): Row[] {
	const method = init.body.get("method");
	const idSubtable = init.body.get("idSubtable");
	if (method === "Events.getCategory") {
		return [
			{ label: "declaration", nb_events: 100, idsubdatatable: 10 },
			{ label: "cse_opinion", nb_events: 50, idsubdatatable: 20 },
			{ label: "compliance_path", nb_events: 30, idsubdatatable: 30 },
		];
	}
	if (method === "Events.getActionFromCategoryId") {
		const starts: Record<string, number> = { "10": 100, "20": 50, "30": 30 };
		const completes: Record<string, number> = { "10": 40, "20": 20, "30": 10 };
		return [
			{ label: "funnel_start", nb_events: starts[idSubtable ?? ""] ?? 0 },
			{
				label: "step_complete",
				nb_events: 0,
				idsubdatatable: Number(idSubtable) + 1,
			},
			{ label: "funnel_complete", nb_events: completes[idSubtable ?? ""] ?? 0 },
		];
	}
	if (method === "Events.getNameFromActionId") {
		if (idSubtable === "11") {
			return [
				{ label: "step_1", nb_events: 80 },
				{ label: "step_2", nb_events: 70 },
				{ label: "step_3", nb_events: 60 },
				{ label: "step_4", nb_events: 55 },
				{ label: "step_5", nb_events: 50 },
			];
		}
		if (idSubtable === "21") return [{ label: "step_1", nb_events: 30 }];
		if (idSubtable === "31") {
			return [
				{ label: "step_1", nb_events: 20 },
				{ label: "step_2", nb_events: 15 },
			];
		}
	}
	return [];
}

describe("fetchMatomoFunnel", () => {
	const fetchSpy = vi.fn();

	beforeEach(() => {
		mockEnv.MATOMO_API_TOKEN = "secret-token";
		mockEnv.MATOMO_API_URL = "https://matomo.test";
		mockEnv.NEXT_PUBLIC_MATOMO_SITE_ID = "1";
		fetchSpy.mockReset();
		fetchSpy.mockImplementation(
			(_url: string, init: { body: URLSearchParams }) =>
				Promise.resolve({
					ok: true,
					json: async () => eventsApiResponder(init),
				}),
		);
		vi.stubGlobal("fetch", fetchSpy);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("builds the three funnels from the hierarchical Events API", async () => {
		const result = await fetchMatomoFunnel({ year: 2024 });

		// Declaration: start 100 → step_1 80 → … → complete 40.
		expect(result.declarationFunnel.map((r) => [r.key, r.count])).toEqual([
			["start", 100],
			["step_1", 80],
			["step_2", 70],
			["step_3", 60],
			["step_4", 55],
			["step_5", 50],
			["complete", 40],
		]);
		// Percentages anchored to start, drop computed vs previous jalon.
		expect(result.declarationFunnel[1]).toMatchObject({
			pctOfStart: 80,
			pctDropFromPrev: 20,
		});
		expect(result.cseFunnel.map((r) => r.count)).toEqual([50, 30, 20]);
		expect(result.complianceFunnel.map((r) => r.count)).toEqual([
			30, 20, 15, 10,
		]);
	});

	it("scopes every call to the campaign year via dimension1", async () => {
		await fetchMatomoFunnel({ year: 2024 });
		const segments = fetchSpy.mock.calls.map((call) =>
			(call[1].body as URLSearchParams).get("segment"),
		);
		expect(segments.every((s) => s?.includes("dimension1==2024"))).toBe(true);
	});

	it("applies the workforce filter to the declaration funnel only", async () => {
		await fetchMatomoFunnel({ year: 2024, sizeRange: "50-99" });
		const categorySegments = fetchSpy.mock.calls
			.filter(
				(call) =>
					(call[1].body as URLSearchParams).get("method") ===
					"Events.getCategory",
			)
			.map((call) => (call[1].body as URLSearchParams).get("segment"));
		const withWorkforce = categorySegments.filter((s) =>
			s?.includes("dimension2==50-99"),
		);
		expect(withWorkforce).toHaveLength(1);
	});

	it("never puts the token in the URL", async () => {
		await fetchMatomoFunnel({ year: 2024 });
		for (const call of fetchSpy.mock.calls) {
			expect(String(call[0])).not.toContain("secret-token");
			expect((call[1].body as URLSearchParams).get("token_auth")).toBe(
				"secret-token",
			);
		}
	});

	it("degrades to empty funnels when the token is absent (no fetch)", async () => {
		mockEnv.MATOMO_API_TOKEN = undefined;

		const result = await fetchMatomoFunnel({ year: 2024 });

		expect(fetchSpy).not.toHaveBeenCalled();
		expect(result.declarationFunnel.every((r) => r.count === 0)).toBe(true);
		expect(result.declarationFunnel).toHaveLength(7);
		expect(result.cseFunnel.every((r) => r.count === 0)).toBe(true);
	});

	it("throws on a non-ok Reporting API response", async () => {
		fetchSpy.mockResolvedValue({
			ok: false,
			status: 502,
			statusText: "Bad Gateway",
		});

		await expect(fetchMatomoFunnel({ year: 2024 })).rejects.toThrow(
			"Matomo Reporting API error: 502 Bad Gateway",
		);
	});
});
