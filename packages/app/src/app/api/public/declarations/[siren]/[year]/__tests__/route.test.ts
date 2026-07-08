import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getPublicDeclarationBySirenYear: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/modules/public-api", () => ({
	getPublicDeclarationBySirenYear: mocks.getPublicDeclarationBySirenYear,
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

const VALID_SIREN = "123456789";

function buildRequest(siren: string, year: string) {
	return new Request(
		`http://localhost/api/public/declarations/${siren}/${year}`,
	);
}

async function callGet(rawSiren: string, rawYear: string) {
	const { GET } = await import("../route");
	return GET(buildRequest(rawSiren, rawYear), {
		params: Promise.resolve({ siren: rawSiren, year: rawYear }),
	});
}

describe("GET /api/public/declarations/[siren]/[year]", () => {
	beforeEach(() => {
		mocks.getPublicDeclarationBySirenYear.mockReset();
		mocks.logAction.mockReset();
	});

	it("returns 400 and logs a failure for an invalid siren", async () => {
		const response = await callGet("abc", "2024");

		expect(response.status).toBe(400);
		expect(mocks.getPublicDeclarationBySirenYear).not.toHaveBeenCalled();
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failure", siren: null }),
		);
	});

	it("returns 400 for a non-numeric year", async () => {
		const response = await callGet(VALID_SIREN, "abcd");

		expect(response.status).toBe(400);
		expect(mocks.getPublicDeclarationBySirenYear).not.toHaveBeenCalled();
	});

	it("returns 400 for a year before 2018", async () => {
		const response = await callGet(VALID_SIREN, "2017");

		expect(response.status).toBe(400);
	});

	it("returns 400 for a year after 2100", async () => {
		const response = await callGet(VALID_SIREN, "2101");

		expect(response.status).toBe(400);
	});

	it("returns 404 and logs a failure when the declaration is absent or unreleased", async () => {
		mocks.getPublicDeclarationBySirenYear.mockResolvedValue(null);

		const response = await callGet(VALID_SIREN, "2024");

		expect(response.status).toBe(404);
		expect(mocks.getPublicDeclarationBySirenYear).toHaveBeenCalledWith(
			VALID_SIREN,
			2024,
		);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failure", errorMessage: "HTTP 404" }),
		);
	});

	it("returns 200 with the declaration and CORS headers on success", async () => {
		const data = { siren: VALID_SIREN, year: 2024 };
		mocks.getPublicDeclarationBySirenYear.mockResolvedValue(data);

		const response = await callGet(VALID_SIREN, "2024");

		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(await response.json()).toEqual(data);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "success", siren: VALID_SIREN }),
		);
	});

	it("returns 500 and logs a failure when the service throws", async () => {
		mocks.getPublicDeclarationBySirenYear.mockRejectedValue(new Error("boom"));

		const response = await callGet(VALID_SIREN, "2024");

		expect(response.status).toBe(500);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failure", errorMessage: "boom" }),
		);
	});
});
