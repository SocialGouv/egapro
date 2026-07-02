import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getPublicDeclarationsBySiren: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/modules/public-api", () => ({
	getPublicDeclarationsBySiren: mocks.getPublicDeclarationsBySiren,
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

const VALID_SIREN = "123456789";

function buildRequest(path: string) {
	return new Request(`http://localhost/api/public/declarations/${path}`);
}

async function callGet(rawSiren: string, query = "") {
	const { GET } = await import("../route");
	return GET(buildRequest(`${rawSiren}${query}`), {
		params: Promise.resolve({ siren: rawSiren }),
	});
}

describe("GET /api/public/declarations/[siren]", () => {
	beforeEach(() => {
		mocks.getPublicDeclarationsBySiren.mockReset();
		mocks.logAction.mockReset();
	});

	it("returns 400 and logs a failure for an invalid siren", async () => {
		const response = await callGet("abc");

		expect(response.status).toBe(400);
		expect(mocks.getPublicDeclarationsBySiren).not.toHaveBeenCalled();
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failure", siren: null }),
		);
	});

	it("returns 400 when the limit param is not an integer in [1, 100]", async () => {
		const response = await callGet(VALID_SIREN, "?limit=0");

		expect(response.status).toBe(400);
		expect(mocks.getPublicDeclarationsBySiren).not.toHaveBeenCalled();
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
		const data = [{ siren: VALID_SIREN, year: 2024 }];
		mocks.getPublicDeclarationsBySiren.mockResolvedValue(data);

		const response = await callGet(VALID_SIREN);

		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Cache-Control")).toContain("max-age=300");
		expect(await response.json()).toEqual(data);
		expect(mocks.getPublicDeclarationsBySiren).toHaveBeenCalledWith(
			VALID_SIREN,
			undefined,
		);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "success", siren: VALID_SIREN }),
		);
	});

	it("forwards a valid limit param to the service", async () => {
		mocks.getPublicDeclarationsBySiren.mockResolvedValue([]);

		const response = await callGet(VALID_SIREN, "?limit=5");

		expect(response.status).toBe(200);
		expect(mocks.getPublicDeclarationsBySiren).toHaveBeenCalledWith(
			VALID_SIREN,
			5,
		);
	});

	it("returns 500 and logs a failure when the service throws", async () => {
		mocks.getPublicDeclarationsBySiren.mockRejectedValue(new Error("boom"));

		const response = await callGet(VALID_SIREN);

		expect(response.status).toBe(500);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failure", errorMessage: "boom" }),
		);
	});
});
