import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getPublicRepresentationBySirenYear: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/modules/public-api", () => ({
	getPublicRepresentationBySirenYear: mocks.getPublicRepresentationBySirenYear,
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

const VALID_SIREN = "123456789";

function buildRequest(siren: string, year: string) {
	return new Request(
		`http://localhost/api/public/representations/${siren}/${year}`,
	);
}

async function callGet(rawSiren: string, rawYear: string) {
	const { GET } = await import("../route");
	return GET(buildRequest(rawSiren, rawYear), {
		params: Promise.resolve({ siren: rawSiren, year: rawYear }),
	});
}

describe("GET /api/public/representations/[siren]/[year]", () => {
	beforeEach(() => {
		mocks.getPublicRepresentationBySirenYear.mockReset();
		mocks.logAction.mockReset();
	});

	it("returns 400 and logs a failure for an invalid siren", async () => {
		const response = await callGet("abc", "2026");

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "SIREN invalide. Attendu : 9 chiffres.",
		});
		expect(mocks.getPublicRepresentationBySirenYear).not.toHaveBeenCalled();
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "public_representations.by_siren_year",
				status: "failure",
				siren: null,
			}),
		);
	});

	it("returns 400 for a non-numeric year", async () => {
		const response = await callGet(VALID_SIREN, "abcd");

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Année invalide." });
		expect(mocks.getPublicRepresentationBySirenYear).not.toHaveBeenCalled();
	});

	it("returns 400 for a year before 2000", async () => {
		const response = await callGet(VALID_SIREN, "1999");

		expect(response.status).toBe(400);
		expect(mocks.getPublicRepresentationBySirenYear).not.toHaveBeenCalled();
	});

	it("returns 400 for a year after 2100", async () => {
		const response = await callGet(VALID_SIREN, "2101");

		expect(response.status).toBe(400);
	});

	it("returns 404 and logs a failure when no submitted declaration exists", async () => {
		mocks.getPublicRepresentationBySirenYear.mockResolvedValue(null);

		const response = await callGet(VALID_SIREN, "2026");

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			error: "Déclaration non trouvée ou non encore publiée.",
		});
		expect(mocks.getPublicRepresentationBySirenYear).toHaveBeenCalledWith(
			VALID_SIREN,
			2026,
		);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failure", errorMessage: "HTTP 404" }),
		);
	});

	it("returns 200 with the declaration and CORS headers on success", async () => {
		const data = { siren: VALID_SIREN, year: 2026 };
		mocks.getPublicRepresentationBySirenYear.mockResolvedValue(data);

		const response = await callGet(VALID_SIREN, "2026");

		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Cache-Control")).toContain("max-age=300");
		expect(await response.json()).toEqual(data);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "public_representations.by_siren_year",
				status: "success",
				siren: VALID_SIREN,
				metadata: { year: 2026 },
			}),
		);
	});

	it("returns 500 and logs a failure when the service throws", async () => {
		mocks.getPublicRepresentationBySirenYear.mockRejectedValue(
			new Error("boom"),
		);
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const response = await callGet(VALID_SIREN, "2026");

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: "Erreur lors de la récupération de la déclaration.",
		});
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failure", errorMessage: "boom" }),
		);
		errorSpy.mockRestore();
	});
});
