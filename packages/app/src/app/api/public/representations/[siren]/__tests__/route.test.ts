import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getPublicRepresentationsBySiren: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/modules/public-api", () => ({
	getPublicRepresentationsBySiren: mocks.getPublicRepresentationsBySiren,
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

const VALID_SIREN = "123456789";

function buildRequest(path: string) {
	return new Request(`http://localhost/api/public/representations/${path}`);
}

async function callGet(rawSiren: string, query = "") {
	const { GET } = await import("../route");
	return GET(buildRequest(`${rawSiren}${query}`), {
		params: Promise.resolve({ siren: rawSiren }),
	});
}

describe("GET /api/public/representations/[siren]", () => {
	beforeEach(() => {
		mocks.getPublicRepresentationsBySiren.mockReset();
		mocks.logAction.mockReset();
	});

	it("returns 400 and logs a failure for an invalid siren", async () => {
		const response = await callGet("abc");

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "SIREN invalide. Attendu : 9 chiffres.",
		});
		expect(mocks.getPublicRepresentationsBySiren).not.toHaveBeenCalled();
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "public_representations.by_siren",
				status: "failure",
				siren: null,
			}),
		);
	});

	it("returns 400 when the limit param is not an integer in [1, 100]", async () => {
		const response = await callGet(VALID_SIREN, "?limit=0");

		expect(response.status).toBe(400);
		expect(mocks.getPublicRepresentationsBySiren).not.toHaveBeenCalled();
	});

	it("returns 400 when the limit param exceeds 100", async () => {
		const response = await callGet(VALID_SIREN, "?limit=101");

		expect(response.status).toBe(400);
	});

	it("returns 400 when the limit param is not numeric", async () => {
		const response = await callGet(VALID_SIREN, "?limit=abc");

		expect(response.status).toBe(400);
	});

	it("returns 200 with the declarations and CORS headers on success", async () => {
		const data = [{ siren: VALID_SIREN, year: 2026 }];
		mocks.getPublicRepresentationsBySiren.mockResolvedValue(data);

		const response = await callGet(VALID_SIREN);

		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Cache-Control")).toContain("max-age=300");
		expect(await response.json()).toEqual(data);
		expect(mocks.getPublicRepresentationsBySiren).toHaveBeenCalledWith(
			VALID_SIREN,
			undefined,
		);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "public_representations.by_siren",
				status: "success",
				siren: VALID_SIREN,
				metadata: { count: 1, limit: null },
			}),
		);
	});

	it("returns an empty array when the siren has no submitted declaration", async () => {
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([]);

		const response = await callGet(VALID_SIREN);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([]);
	});

	it("forwards a valid limit param to the service and audits it", async () => {
		mocks.getPublicRepresentationsBySiren.mockResolvedValue([]);

		const response = await callGet(VALID_SIREN, "?limit=5");

		expect(response.status).toBe(200);
		expect(mocks.getPublicRepresentationsBySiren).toHaveBeenCalledWith(
			VALID_SIREN,
			5,
		);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ metadata: { count: 0, limit: 5 } }),
		);
	});

	it("returns 500 and logs a failure when the service throws", async () => {
		mocks.getPublicRepresentationsBySiren.mockRejectedValue(new Error("boom"));
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const response = await callGet(VALID_SIREN);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: "Erreur lors de la récupération des déclarations.",
		});
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failure", errorMessage: "boom" }),
		);
		errorSpy.mockRestore();
	});
});
