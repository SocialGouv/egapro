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

import {
	buildFunnelRows,
	fetchMatomoCategoryModel,
	fetchMatomoCseStatusConfirmations,
	fetchMatomoDeviceBreakdown,
	fetchMatomoFunnel,
	fetchMatomoHelpLinks,
} from "../matomo";

type Row = {
	label: string;
	nb_events?: number;
	idsubdatatable?: number;
	nb_visits?: number;
	avg_event_value?: number | string;
};

function setMatomoEnv(): void {
	mockEnv.MATOMO_API_TOKEN = "secret-token";
	mockEnv.MATOMO_API_URL = "https://matomo.test";
	mockEnv.NEXT_PUBLIC_MATOMO_SITE_ID = "1";
}

function stubFetch(responder: (init: { body: URLSearchParams }) => Row[]) {
	const fetchSpy = vi.fn((_url: string, init: { body: URLSearchParams }) =>
		Promise.resolve({ ok: true, json: async () => responder(init) }),
	);
	vi.stubGlobal("fetch", fetchSpy);
	return fetchSpy;
}

// `funnel_start` / `funnel_complete` counts come from the category's action
// subtable; the per-step counts come from the event NAME report scoped by a
// segment (`eventCategory==<cat>;eventAction==step_complete`) — Matomo does not
// reliably archive the action→name subtable. The segment is visit-scoped, so the
// declaration response includes an "Event Name not defined" row (a co-occurring
// nameless event) that `buildFunnelRows` must ignore.
function eventsApiResponder(init: { body: URLSearchParams }): Row[] {
	const method = init.body.get("method");
	const idSubtable = init.body.get("idSubtable");
	const segment = init.body.get("segment") ?? "";
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
			{ label: "step_complete", nb_events: 0 },
			{ label: "funnel_complete", nb_events: completes[idSubtable ?? ""] ?? 0 },
		];
	}
	if (method === "Events.getName") {
		if (segment.includes("eventCategory==declaration")) {
			return [
				{ label: "Event Name not defined", nb_events: 999 },
				{ label: "step_1", nb_events: 80 },
				{ label: "step_2", nb_events: 70 },
				{ label: "step_3", nb_events: 60 },
				{ label: "step_4", nb_events: 55 },
				{ label: "step_5", nb_events: 50 },
			];
		}
		if (segment.includes("eventCategory==cse_opinion")) {
			return [{ label: "step_1", nb_events: 30 }];
		}
		if (segment.includes("eventCategory==compliance_path")) {
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

	it("builds the three funnels from the Events API (ignoring leaked names)", async () => {
		const result = await fetchMatomoFunnel({ year: 2024 });

		// Declaration: start 100 → step_1 80 → … → complete 40. The visit-scoped
		// "Event Name not defined" row is ignored (not a step key).
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

	it("degrades to empty funnels when a response row fails schema validation", async () => {
		// Reporting API returns a 200 with a malformed row (no `label`): the
		// boundary schema rejects it, so the call yields no rows → empty funnel
		// rather than a corrupted or crashing dashboard.
		fetchSpy.mockResolvedValue({
			ok: true,
			json: async () => [{ nb_events: 5 }],
		});

		const result = await fetchMatomoFunnel({ year: 2024 });

		expect(result.declarationFunnel.every((r) => r.count === 0)).toBe(true);
		expect(result.declarationFunnel).toHaveLength(7);
		expect(result.cseFunnel.every((r) => r.count === 0)).toBe(true);
		expect(result.complianceFunnel.every((r) => r.count === 0)).toBe(true);
	});
});

// `category_import` count + `category_import_duration` avg come from the
// document action subtable; failure types and help slugs come from the event
// NAME report scoped by an `eventCategory==…;eventAction==…` segment (the
// action→name subtable is not reliably archived).
function behaviourApiResponder(init: { body: URLSearchParams }): Row[] {
	const method = init.body.get("method");
	const idSubtable = init.body.get("idSubtable");
	const segment = init.body.get("segment") ?? "";

	if (method === "Events.getCategory") {
		return [{ label: "document", nb_events: 200, idsubdatatable: 40 }];
	}
	if (method === "Events.getActionFromCategoryId" && idSubtable === "40") {
		return [
			{ label: "category_import", nb_events: 55 },
			{ label: "category_import_failure", nb_events: 8 },
			{ label: "category_import_duration", avg_event_value: 12.6 },
		];
	}
	if (method === "Events.getName") {
		if (segment.includes("eventAction==category_import_failure")) {
			return [
				{ label: "missing-columns", nb_events: 5 },
				{ label: "invalid-value", nb_events: 2 },
				{ label: "empty-file", nb_events: 1 },
			];
		}
		if (segment.includes("eventAction==help_link_click")) {
			return [
				{ label: "objective_criteria", nb_events: 30 },
				{ label: "cse_models", nb_events: 50 },
				{ label: "joint_evaluation", nb_events: 5 },
				{ label: "corrective_actions", nb_events: 12 },
			];
		}
	}
	return [];
}

describe("fetchMatomoCategoryModel", () => {
	beforeEach(() => setMatomoEnv());
	afterEach(() => vi.restoreAllMocks());

	it("counts imports and splits failures by error type", async () => {
		stubFetch(behaviourApiResponder);

		const { rows } = await fetchMatomoCategoryModel({ year: 2024 });

		expect(rows).toEqual([
			{ key: "import", label: "Imports réussis", count: 55 },
			{
				key: "failure_missing-columns",
				label: "Échec import — colonnes manquantes",
				count: 5,
			},
			{
				key: "failure_invalid-value",
				label: "Échec import — valeur invalide",
				count: 2,
			},
			{
				key: "failure_empty-file",
				label: "Échec import — fichier vide",
				count: 1,
			},
		]);
	});

	it("parses avgImportDurationSeconds (rounded) from the duration action's avg_event_value", async () => {
		stubFetch(behaviourApiResponder);

		const { avgImportDurationSeconds } = await fetchMatomoCategoryModel({
			year: 2024,
		});

		expect(avgImportDurationSeconds).toBe(13);
	});

	it("coerces a string avg_event_value (Matomo sometimes serialises it as text)", async () => {
		stubFetch((init) => {
			if (init.body.get("method") === "Events.getActionFromCategoryId") {
				return [{ label: "category_import_duration", avg_event_value: "9.4" }];
			}
			return behaviourApiResponder(init);
		});

		const { avgImportDurationSeconds } = await fetchMatomoCategoryModel({
			year: 2024,
		});

		expect(avgImportDurationSeconds).toBe(9);
	});

	it("returns a null duration when the duration action is absent", async () => {
		stubFetch((init) => {
			if (init.body.get("method") === "Events.getActionFromCategoryId") {
				return [{ label: "category_import", nb_events: 3 }];
			}
			if (init.body.get("method") === "Events.getName") return [];
			return behaviourApiResponder(init);
		});

		const { rows, avgImportDurationSeconds } = await fetchMatomoCategoryModel({
			year: 2024,
		});

		expect(avgImportDurationSeconds).toBeNull();
		expect(rows).toEqual([
			{ key: "import", label: "Imports réussis", count: 3 },
		]);
	});

	it("scopes the read by calendar year, never by a campaign custom dimension", async () => {
		const fetchSpy = stubFetch(behaviourApiResponder);

		await fetchMatomoCategoryModel({ year: 2024 });

		for (const call of fetchSpy.mock.calls) {
			const body = call[1].body as URLSearchParams;
			// Behavioural events carry no campaign dimension — the failure read is
			// scoped by an event segment, never `dimension1` / `dimension2`.
			expect(body.get("segment")).not.toContain("dimension");
			expect(body.get("date")).toBe("2024-12-31");
			expect(body.get("period")).toBe("year");
		}
	});

	it("degrades to empty rows and a null duration without a token (no fetch)", async () => {
		mockEnv.MATOMO_API_TOKEN = undefined;
		const fetchSpy = stubFetch(behaviourApiResponder);

		const result = await fetchMatomoCategoryModel({ year: 2024 });

		expect(fetchSpy).not.toHaveBeenCalled();
		expect(result).toEqual({ rows: [], avgImportDurationSeconds: null });
	});

	it("surfaces a well-formed Matomo error object as a thrown error", async () => {
		const fetchSpy = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: async () => ({ result: "error", message: "Invalid token" }),
			}),
		);
		vi.stubGlobal("fetch", fetchSpy);

		await expect(fetchMatomoCategoryModel({ year: 2024 })).rejects.toThrow(
			"Matomo Reporting API error: Invalid token",
		);
	});
});

describe("fetchMatomoHelpLinks", () => {
	beforeEach(() => setMatomoEnv());
	afterEach(() => vi.restoreAllMocks());

	it("maps known slugs to French labels and sorts by descending count", async () => {
		stubFetch(behaviourApiResponder);

		const { rows } = await fetchMatomoHelpLinks({ year: 2024 });

		expect(rows).toEqual([
			{ key: "cse_models", label: "Modèles d'avis CSE", count: 50 },
			{
				key: "objective_criteria",
				label: "Critères objectifs et non sexistes",
				count: 30,
			},
			{
				key: "corrective_actions",
				label: "Actions correctives et seconde déclaration",
				count: 12,
			},
			{
				key: "joint_evaluation",
				label: "Évaluation conjointe des rémunérations",
				count: 5,
			},
		]);
	});

	it("drops unknown slugs and leaked names not in the label map (allow-list)", async () => {
		stubFetch((init) => {
			if (
				init.body.get("method") === "Events.getName" &&
				(init.body.get("segment") ?? "").includes("help_link_click")
			) {
				return [
					{ label: "cse_models", nb_events: 10 },
					{ label: "unknown_slug", nb_events: 7 },
					// `step_1` leaked from a co-occurring funnel event in the same
					// visit (the segment is visit-scoped) — must be dropped.
					{ label: "step_1", nb_events: 99 },
				];
			}
			return behaviourApiResponder(init);
		});

		const { rows } = await fetchMatomoHelpLinks({ year: 2024 });

		expect(rows).toEqual([
			{ key: "cse_models", label: "Modèles d'avis CSE", count: 10 },
		]);
	});

	it("degrades to empty rows without a token (no fetch)", async () => {
		mockEnv.MATOMO_API_TOKEN = undefined;
		const fetchSpy = stubFetch(behaviourApiResponder);

		const result = await fetchMatomoHelpLinks({ year: 2024 });

		expect(fetchSpy).not.toHaveBeenCalled();
		expect(result).toEqual({ rows: [] });
	});
});

// `DevicesDetection.getType` is branched on the per-behaviour event segment so
// each tracked behaviour can return a distinct device mix.
function deviceApiResponder(init: { body: URLSearchParams }): Row[] {
	if (init.body.get("method") !== "DevicesDetection.getType") return [];
	const segment = init.body.get("segment") ?? "";
	if (segment.includes("declaration")) {
		return [
			{ label: "Desktop", nb_visits: 30 },
			{ label: "Smartphone", nb_visits: 12 },
			{ label: "Tablet", nb_visits: 3 },
		];
	}
	if (segment.includes("cse_opinion")) {
		return [{ label: "Desktop", nb_visits: 8 }];
	}
	if (segment.includes("search")) {
		return [
			{ label: "Smartphone", nb_visits: 20 },
			{ label: "Phablet", nb_visits: 4 },
		];
	}
	return [];
}

describe("fetchMatomoDeviceBreakdown", () => {
	beforeEach(() => setMatomoEnv());
	afterEach(() => vi.restoreAllMocks());

	it("classifies device labels into desktop / smartphone / tablet per behaviour", async () => {
		stubFetch(deviceApiResponder);

		const { rows } = await fetchMatomoDeviceBreakdown({ year: 2024 });

		expect(rows).toEqual([
			{
				key: "modification",
				label: "Modification (déclaration)",
				desktop: 30,
				smartphone: 12,
				tablet: 3,
			},
			{
				key: "deposit",
				label: "Dépôt (avis CSE)",
				desktop: 8,
				smartphone: 0,
				tablet: 0,
			},
			{
				key: "consultation",
				label: "Consultation",
				desktop: 0,
				smartphone: 20,
				tablet: 0,
			},
		]);
	});

	it("ignores device labels that match no known type", async () => {
		stubFetch((init) => {
			if (init.body.get("method") !== "DevicesDetection.getType") return [];
			return [
				{ label: "Desktop", nb_visits: 5 },
				{ label: "Console", nb_visits: 9 },
				{ label: "Smart TV", nb_visits: 4 },
			];
		});

		const { rows } = await fetchMatomoDeviceBreakdown({ year: 2024 });

		for (const row of rows) {
			expect(row).toMatchObject({ desktop: 5, smartphone: 0, tablet: 0 });
		}
	});

	it("fires one DevicesDetection.getType call per behaviour with its event segment", async () => {
		const fetchSpy = stubFetch(deviceApiResponder);

		await fetchMatomoDeviceBreakdown({ year: 2024 });

		const segments = fetchSpy.mock.calls.map((call) =>
			(call[1].body as URLSearchParams).get("segment"),
		);
		expect(segments).toHaveLength(3);
		expect(
			segments.some((s) => s?.includes("eventCategory==declaration")),
		).toBe(true);
		expect(
			segments.some((s) => s?.includes("eventCategory==cse_opinion")),
		).toBe(true);
		expect(segments.some((s) => s?.includes("eventCategory==search"))).toBe(
			true,
		);
	});

	it("degrades to three all-zero rows without a token (no fetch)", async () => {
		mockEnv.MATOMO_API_TOKEN = undefined;
		const fetchSpy = stubFetch(deviceApiResponder);

		const { rows } = await fetchMatomoDeviceBreakdown({ year: 2024 });

		expect(fetchSpy).not.toHaveBeenCalled();
		expect(rows.map((row) => row.key)).toEqual([
			"modification",
			"deposit",
			"consultation",
		]);
		for (const row of rows) {
			expect(row).toMatchObject({ desktop: 0, smartphone: 0, tablet: 0 });
		}
	});
});

// The confirmation volume comes from the event NAME report scoped by an
// `eventCategory==cse_status;eventAction==cse_status_confirm` segment. The
// segment is visit-scoped, so a co-occurring event name leaks into the rows and
// must be dropped by the oui/non allow-list.
function cseStatusApiResponder(init: { body: URLSearchParams }): Row[] {
	if (init.body.get("method") !== "Events.getName") return [];
	const segment = init.body.get("segment") ?? "";
	if (!segment.includes("eventAction==cse_status_confirm")) return [];
	return [
		{ label: "oui", nb_events: 42 },
		{ label: "non", nb_events: 13 },
		// Leaked from a co-occurring event in the same visit — not oui/non, so
		// it must be ignored (and never inflate `total`).
		{ label: "step_1", nb_events: 999 },
	];
}

describe("fetchMatomoCseStatusConfirmations", () => {
	beforeEach(() => setMatomoEnv());
	afterEach(() => vi.restoreAllMocks());

	it("splits oui/non and drops leaked labels via the allow-list", async () => {
		stubFetch(cseStatusApiResponder);

		const result = await fetchMatomoCseStatusConfirmations({ year: 2024 });

		expect(result).toEqual({ total: 55, yes: 42, no: 13 });
	});

	it("scopes the read by the cse_status / cse_status_confirm event segment", async () => {
		const fetchSpy = stubFetch(cseStatusApiResponder);

		await fetchMatomoCseStatusConfirmations({ year: 2024 });

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const segment = (fetchSpy.mock.calls[0]?.[1].body as URLSearchParams).get(
			"segment",
		);
		expect(segment).toContain("eventCategory==cse_status");
		expect(segment).toContain("eventAction==cse_status_confirm");
	});

	it("returns all-zero without a token (no fetch)", async () => {
		mockEnv.MATOMO_API_TOKEN = undefined;
		const fetchSpy = stubFetch(cseStatusApiResponder);

		const result = await fetchMatomoCseStatusConfirmations({ year: 2024 });

		expect(fetchSpy).not.toHaveBeenCalled();
		expect(result).toEqual({ total: 0, yes: 0, no: 0 });
	});

	it("returns all-zero when Matomo reports no confirmation names", async () => {
		stubFetch(() => []);

		const result = await fetchMatomoCseStatusConfirmations({ year: 2024 });

		expect(result).toEqual({ total: 0, yes: 0, no: 0 });
	});
});

describe("buildFunnelRows", () => {
	const jalons = [
		{ key: "start", label: "Démarrage", kind: "start" as const },
		{ key: "mid", label: "Milieu", kind: "step" as const, step: "mid" },
		{ key: "complete", label: "Fin", kind: "complete" as const },
	];

	it("anchors pctOfStart to the first jalon and rounds to a whole number", () => {
		const rows = buildFunnelRows(jalons, {
			start: 200,
			mid: 150,
			complete: 50,
		});

		expect(rows.map((r) => [r.count, r.pctOfStart])).toEqual([
			[200, 100],
			[150, 75],
			[50, 25],
		]);
	});

	it("computes pctDropFromPrev as null on the first jalon and rounded thereafter", () => {
		const rows = buildFunnelRows(jalons, {
			start: 200,
			mid: 150,
			complete: 50,
		});

		expect(rows[0]?.pctDropFromPrev).toBeNull();
		expect(rows[1]?.pctDropFromPrev).toBe(25);
		expect(rows[2]?.pctDropFromPrev).toBe(67);
	});

	it("yields 0 percentages when the funnel start is empty (no division by zero)", () => {
		const rows = buildFunnelRows(jalons, {});

		expect(rows.map((r) => r.count)).toEqual([0, 0, 0]);
		for (const row of rows) {
			expect(row.pctOfStart).toBe(0);
		}
		expect(rows[0]?.pctDropFromPrev).toBeNull();
		expect(rows[1]?.pctDropFromPrev).toBe(0);
	});

	it("yields pctDropFromPrev 0 when the previous jalon is empty mid-funnel", () => {
		const rows = buildFunnelRows(jalons, { start: 100, mid: 0, complete: 0 });

		expect(rows[1]?.pctDropFromPrev).toBe(100);
		expect(rows[2]?.pctDropFromPrev).toBe(0);
	});
});
