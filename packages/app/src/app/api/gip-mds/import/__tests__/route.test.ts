import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	fetchGipCsv: vi.fn(),
	importGipCsvToDb: vi.fn(),
}));

vi.mock("~/server/services/gipMds", () => ({
	fetchGipCsv: mocks.fetchGipCsv,
	importGipCsvToDb: mocks.importGipCsvToDb,
}));

vi.mock("~/server/db", () => ({ db: {} }));

vi.mock("~/server/audit/withAuditedRoute", () => ({
	withAuditedRoute: (_config: unknown, handler: unknown) => handler,
}));

vi.mock("~/modules/audit", () => ({
	AUDIT_ACTIONS: { GIP_MDS_IMPORT: "gip_mds.import" },
}));

async function loadRoute(envOverrides: Record<string, string | undefined>) {
	vi.resetModules();
	vi.doMock("~/env.js", () => ({ env: envOverrides }));

	const { POST } = await import("../route");
	return POST;
}

function post(headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/gip-mds/import", {
		method: "POST",
		headers,
	});
}

afterEach(() => {
	vi.doUnmock("~/env.js");
	vi.resetModules();
	vi.clearAllMocks();
});

describe("POST /api/gip-mds/import", () => {
	it("refuses when the token is not configured, instead of skipping the check", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const POST = await loadRoute({
			EGAPRO_GIP_MDS_API_TOKEN: undefined,
			EGAPRO_GIP_MDS_API_URL: "https://suit.example.com/gipmds/latest",
		});

		const response = await POST(post());

		expect(response.status).toBe(401);
		expect(mocks.fetchGipCsv).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("EGAPRO_GIP_MDS_API_TOKEN"),
		);
	});

	it("rejects a wrong bearer token", async () => {
		const POST = await loadRoute({
			EGAPRO_GIP_MDS_API_TOKEN: "expected-token",
			EGAPRO_GIP_MDS_API_URL: "https://suit.example.com/gipmds/latest",
		});

		const response = await POST(post({ authorization: "Bearer wrong" }));

		expect(response.status).toBe(401);
		expect(mocks.fetchGipCsv).not.toHaveBeenCalled();
	});

	it("refuses an empty configured token, even against an empty bearer", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const POST = await loadRoute({
			EGAPRO_GIP_MDS_API_TOKEN: "",
			EGAPRO_GIP_MDS_API_URL: "https://suit.example.com/gipmds/latest",
		});

		const response = await POST(post({ authorization: "Bearer " }));

		expect(response.status).toBe(401);
		expect(mocks.fetchGipCsv).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("EGAPRO_GIP_MDS_API_TOKEN"),
		);
		errorSpy.mockRestore();
	});

	it.each([
		["an anonymous call", undefined],
		["an empty bearer", "Bearer "],
		["the raw token without scheme", "expected-token"],
		["another scheme", "Basic expected-token"],
		["a lowercase scheme", "bearer expected-token"],
	])("rejects %s", async (_label, authorization) => {
		const POST = await loadRoute({
			EGAPRO_GIP_MDS_API_TOKEN: "expected-token",
			EGAPRO_GIP_MDS_API_URL: "https://suit.example.com/gipmds/latest",
		});

		const response = await POST(
			post(authorization === undefined ? {} : { authorization }),
		);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.fetchGipCsv).not.toHaveBeenCalled();
	});

	it("returns 412 when the source URL is not configured", async () => {
		const POST = await loadRoute({
			EGAPRO_GIP_MDS_API_TOKEN: "expected-token",
			EGAPRO_GIP_MDS_API_URL: undefined,
		});

		const response = await POST(
			post({ authorization: "Bearer expected-token" }),
		);

		expect(response.status).toBe(412);
		expect(mocks.fetchGipCsv).not.toHaveBeenCalled();
	});

	it("imports when the bearer token matches", async () => {
		mocks.fetchGipCsv.mockResolvedValue("csv");
		mocks.importGipCsvToDb.mockResolvedValue({ inserted: 2 });
		const POST = await loadRoute({
			EGAPRO_GIP_MDS_API_TOKEN: "expected-token",
			EGAPRO_GIP_MDS_API_URL: "https://suit.example.com/gipmds/latest",
		});

		const response = await POST(
			post({ authorization: "Bearer expected-token" }),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			success: true,
			inserted: 2,
		});
		expect(mocks.fetchGipCsv).toHaveBeenCalledWith(
			"https://suit.example.com/gipmds/latest",
		);
	});

	it("answers a failed import with a generic message, keeping the detail in the server log", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const failure = new Error(
			"connect ECONNREFUSED internal-host.example:5432 relation gip_mds_data",
		);
		mocks.fetchGipCsv.mockRejectedValue(failure);
		const POST = await loadRoute({
			EGAPRO_GIP_MDS_API_TOKEN: "expected-token",
			EGAPRO_GIP_MDS_API_URL: "https://suit.example.com/gipmds/latest",
		});

		const response = await POST(
			post({ authorization: "Bearer expected-token" }),
		);

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "GIP MDS import failed",
		});
		expect(errorSpy).toHaveBeenCalledWith("[gip-mds/import] Failed:", failure);
	});
});
