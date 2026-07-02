import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	searchPublicDeclarations: vi.fn(),
	logAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/server/services/publicDeclarationsService", () => ({
	searchPublicDeclarations: mocks.searchPublicDeclarations,
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

const BASE_URL = "http://localhost/api/public/declarations";

function request(query = ""): Request {
	return new Request(`${BASE_URL}${query}`);
}

const EMPTY_RESULT = { data: [], count: 0 };

beforeEach(() => {
	vi.clearAllMocks();
	mocks.searchPublicDeclarations.mockResolvedValue(EMPTY_RESULT);
});

describe("GET /api/public/declarations", () => {
	it("returns the search result as JSON with CORS and cache headers", async () => {
		mocks.searchPublicDeclarations.mockResolvedValue({
			data: [{ siren: "123456789" }],
			count: 1,
		});
		const { GET } = await import("../route");

		const response = await GET(request());

		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Cache-Control")).toContain("max-age=300");
		expect(await response.json()).toEqual({
			data: [{ siren: "123456789" }],
			count: 1,
		});
	});

	it("applies defaults for limit and offset when omitted", async () => {
		const { GET } = await import("../route");

		await GET(request());

		expect(mocks.searchPublicDeclarations).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
		});
	});

	it("parses and coerces every supported query parameter", async () => {
		const { GET } = await import("../route");

		await GET(
			request(
				"?q=acme&region=11&departement=75&naf=62.01Z&year=2023&limit=25&offset=50",
			),
		);

		expect(mocks.searchPublicDeclarations).toHaveBeenCalledWith({
			q: "acme",
			region: "11",
			departement: "75",
			naf: "62.01Z",
			year: 2023,
			limit: 25,
			offset: 50,
		});
	});

	it("returns 400 with issue details for an out-of-range limit", async () => {
		const { GET } = await import("../route");

		const response = await GET(request("?limit=999"));

		expect(response.status).toBe(400);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		const body = await response.json();
		expect(body.error).toBe("Paramètres invalides.");
		expect(Array.isArray(body.details)).toBe(true);
		expect(mocks.searchPublicDeclarations).not.toHaveBeenCalled();
	});

	it("returns 400 when a numeric parameter is not a number", async () => {
		const { GET } = await import("../route");

		const response = await GET(request("?year=abc"));

		expect(response.status).toBe(400);
		expect(mocks.searchPublicDeclarations).not.toHaveBeenCalled();
	});

	it("returns 400 when q is present but blank", async () => {
		const { GET } = await import("../route");

		const response = await GET(request("?q="));

		expect(response.status).toBe(400);
		expect(mocks.searchPublicDeclarations).not.toHaveBeenCalled();
	});

	it("returns 500 when the service throws", async () => {
		mocks.searchPublicDeclarations.mockRejectedValue(new Error("db down"));
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { GET } = await import("../route");

		const response = await GET(request());

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: "Erreur lors de la récupération des déclarations.",
		});
		errorSpy.mockRestore();
	});

	it("writes a success audit entry with the raw query params as metadata", async () => {
		const { GET } = await import("../route");

		await GET(request("?q=acme&region=11"));

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "public_declarations.search",
				status: "success",
				metadata: {
					q: "acme",
					region: "11",
					departement: null,
					naf: null,
					year: null,
				},
			}),
		);
	});

	it("records every raw query param in the audit metadata", async () => {
		const { GET } = await import("../route");

		await GET(request("?q=acme&region=11&departement=75&naf=62.01Z&year=2023"));

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: {
					q: "acme",
					region: "11",
					departement: "75",
					naf: "62.01Z",
					year: "2023",
				},
			}),
		);
	});

	it("nulls every metadata field when no query param is provided", async () => {
		const { GET } = await import("../route");

		await GET(request());

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: {
					q: null,
					region: null,
					departement: null,
					naf: null,
					year: null,
				},
			}),
		);
	});

	it("writes a failure audit entry when the service throws", async () => {
		mocks.searchPublicDeclarations.mockRejectedValue(new Error("db down"));
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { GET } = await import("../route");

		await GET(request());

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "public_declarations.search",
				status: "failure",
			}),
		);
		errorSpy.mockRestore();
	});
});

describe("OPTIONS /api/public/declarations", () => {
	it("answers the CORS preflight with 204 and the CORS headers", async () => {
		const { OPTIONS } = await import("../route");

		const response = await OPTIONS();

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
			"GET",
		);
		expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
			"OPTIONS",
		);
	});
});
