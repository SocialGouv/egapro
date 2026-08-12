import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeRepresentationRow as makeRow } from "./helpers/representationRowFixture";

const mockFetchRepresentations = vi.fn().mockResolvedValue([]);

vi.mock("~/server/db", () => ({ db: {} }));

vi.mock("~/modules/export/fetchRepresentations", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("~/modules/export/fetchRepresentations")
	>()),
	fetchSubmittedRepresentations: (...args: unknown[]) =>
		mockFetchRepresentations(...args),
}));

/**
 * APISIX-forwarded requests carry `X-Gateway-Forwarded` (injected by the
 * gateway's `proxy-rewrite` plugin). Bearer + rate-limit are enforced by
 * APISIX upstream, so tests only need to simulate the header presence that
 * the middleware has already validated — same pattern as `exportApi.test.ts`.
 */
function gatewayForwardedRequest(url: string): Request {
	return new Request(url, {
		headers: { "x-gateway-forwarded": "test-gateway-secret" },
	});
}

describe("GET /api/v1/export/representations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchRepresentations.mockResolvedValue([]);
	});

	it("should return 403 when X-Gateway-Forwarded header is missing", async () => {
		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			new Request("http://localhost/api/v1/export/representations"),
		);

		expect(response.status).toBe(403);
		expect(mockFetchRepresentations).not.toHaveBeenCalled();
	});

	it("should return 403 when the gateway header is present but empty", async () => {
		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			new Request(
				"http://localhost/api/v1/export/representations?date_begin=2027-03-15",
				{ headers: { "x-gateway-forwarded": "" } },
			),
		);

		expect(response.status).toBe(403);
	});

	it("should return 400 when date_begin param is missing", async () => {
		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			gatewayForwardedRequest("http://localhost/api/v1/export/representations"),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toContain("date_begin");
		expect(body.details).toBeDefined();
	});

	it("should return 400 when date_begin format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			gatewayForwardedRequest(
				"http://localhost/api/v1/export/representations?date_begin=2027-3-5",
			),
		);

		expect(response.status).toBe(400);
	});

	it("should return 400 when date_end format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			gatewayForwardedRequest(
				"http://localhost/api/v1/export/representations?date_begin=2027-03-15&date_end=bad",
			),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.details).toBeDefined();
	});

	it("should return the same error shape as the declarations endpoint on a missing date_begin", async () => {
		const [{ GET }, declarations] = await Promise.all([
			import("~/app/api/v1/export/representations/route"),
			import("~/app/api/v1/export/declarations/route"),
		]);

		const [representationsBody, declarationsBody] = await Promise.all([
			GET(
				gatewayForwardedRequest(
					"http://localhost/api/v1/export/representations",
				),
			).then((r) => r.json()),
			declarations
				.GET(
					gatewayForwardedRequest(
						"http://localhost/api/v1/export/declarations",
					),
				)
				.then((r) => r.json()),
		]);

		expect(Object.keys(representationsBody)).toEqual(
			Object.keys(declarationsBody),
		);
		expect(representationsBody.error).toBe(declarationsBody.error);
	});

	it("should return an empty envelope when no declaration matches", async () => {
		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			gatewayForwardedRequest(
				"http://localhost/api/v1/export/representations?date_begin=2027-03-15",
			),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(Object.keys(body)).toEqual([
			"Date_debut",
			"Date_fin",
			"Nombre",
			"Representations",
		]);
		expect(body.Nombre).toBe(0);
		expect(body.Representations).toEqual([]);
		expect(body.Date_debut).toBe("2027-03-15");
		expect(body.Date_fin).toBe("2027-03-16");
	});

	it("should default date_end to the day after date_begin (S29)", async () => {
		const { GET } = await import("~/app/api/v1/export/representations/route");
		await GET(
			gatewayForwardedRequest(
				"http://localhost/api/v1/export/representations?date_begin=2027-03-15",
			),
		);

		expect(mockFetchRepresentations).toHaveBeenCalledWith(
			"2027-03-15",
			"2027-03-16",
		);
	});

	it("should roll the default date_end over a month boundary", async () => {
		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			gatewayForwardedRequest(
				"http://localhost/api/v1/export/representations?date_begin=2027-02-28",
			),
		);

		expect((await response.json()).Date_fin).toBe("2027-03-01");
		expect(mockFetchRepresentations).toHaveBeenCalledWith(
			"2027-02-28",
			"2027-03-01",
		);
	});

	it("should use date_end when provided (S29)", async () => {
		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			gatewayForwardedRequest(
				"http://localhost/api/v1/export/representations?date_begin=2027-03-15&date_end=2027-03-20",
			),
		);

		expect(response.status).toBe(200);
		expect((await response.json()).Date_fin).toBe("2027-03-20");
		expect(mockFetchRepresentations).toHaveBeenCalledWith(
			"2027-03-15",
			"2027-03-20",
		);
	});

	it("should return the assembled representations and their count (S29)", async () => {
		mockFetchRepresentations.mockResolvedValue([
			makeRow(),
			makeRow({ id: "repr-2", siren: "987654321" }),
		]);

		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			gatewayForwardedRequest(
				"http://localhost/api/v1/export/representations?date_begin=2027-03-15",
			),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Nombre).toBe(2);
		expect(body.Representations).toHaveLength(2);
		expect(body.Representations[0]).toMatchObject({
			id: "repr-1",
			SIREN: "123456789",
			Année_référence: 2027,
			Pourcentage_femmes_cadres: 40,
			Pourcentage_hommes_cadres: 60,
			Pourcentage_femmes_membres: 45.5,
			Pourcentage_hommes_membres: 54.5,
			Date_déclaration: "2027-03-15T10:00:00.000Z",
		});
		expect(body.Representations[1].SIREN).toBe("987654321");
	});

	it("should return full identity and location for a non-diffusible company (S30)", async () => {
		mockFetchRepresentations.mockResolvedValue([
			makeRow({
				siren: "123456789",
				companyName: "Entreprise Non Diffusible",
				address: "2 rue Secrète, 69001 Lyon",
				nafCode: "70.10Z",
				region: "Auvergne-Rhône-Alpes",
				departmentLabel: "Rhône",
			}),
		]);

		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			gatewayForwardedRequest(
				"http://localhost/api/v1/export/representations?date_begin=2027-03-15",
			),
		);

		expect(response.status).toBe(200);
		const representation = (await response.json()).Representations[0];
		expect(representation.Raison_sociale).toBe("Entreprise Non Diffusible");
		expect(representation.Adresse).toBe("2 rue Secrète, 69001 Lyon");
		expect(representation.Code_NAF).toBe("70.10Z");
		expect(representation.Région).toBe("Auvergne-Rhône-Alpes");
		expect(representation.Département).toBe("Rhône");
	});

	it("should not expose a Declarations key, the remuneration envelope being untouched", async () => {
		mockFetchRepresentations.mockResolvedValue([makeRow()]);

		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			gatewayForwardedRequest(
				"http://localhost/api/v1/export/representations?date_begin=2027-03-15",
			),
		);

		expect(await response.json()).not.toHaveProperty("Declarations");
	});

	it("should return 500 when the fetch throws", async () => {
		mockFetchRepresentations.mockRejectedValue(
			new Error("DB connection failed"),
		);

		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			gatewayForwardedRequest(
				"http://localhost/api/v1/export/representations?date_begin=2027-03-15",
			),
		);

		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.error).toBe(
			"Erreur lors de la récupération des données de représentation équilibrée",
		);
		expect(JSON.stringify(body)).not.toContain("DB connection failed");
	});
});
