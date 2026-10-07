import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	generateYearlyExport: vi.fn(),
}));

vi.mock("~/modules/export", () => ({
	generateYearlyExport: mocks.generateYearlyExport,
}));

vi.mock("~/server/db", () => ({ db: {} }));

vi.mock("~/server/audit/withAuditedRoute", () => ({
	withAuditedRoute: (_config: unknown, handler: unknown) => handler,
}));

vi.mock("~/modules/audit", () => ({
	AUDIT_ACTIONS: { EXPORT_GENERATE: "export.generate" },
}));

async function loadRoute(envOverrides: Record<string, string | undefined>) {
	vi.resetModules();
	vi.doMock("~/env.js", () => ({ env: envOverrides }));

	const { POST } = await import("../route");
	return POST;
}

function post(headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/export/generate?year=2026", {
		method: "POST",
		headers,
	});
}

afterEach(() => {
	vi.doUnmock("~/env.js");
	vi.resetModules();
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

describe("POST /api/export/generate", () => {
	it("refuses when the token is not configured, instead of skipping the check", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const POST = await loadRoute({ EGAPRO_EXPORT_API_TOKEN: undefined });

		const response = await POST(post());

		expect(response.status).toBe(401);
		expect(mocks.generateYearlyExport).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalled();
	});

	it("rejects an anonymous call", async () => {
		const POST = await loadRoute({ EGAPRO_EXPORT_API_TOKEN: "expected-token" });

		const response = await POST(post());

		expect(response.status).toBe(401);
		expect(mocks.generateYearlyExport).not.toHaveBeenCalled();
	});

	it("rejects a wrong bearer token", async () => {
		const POST = await loadRoute({ EGAPRO_EXPORT_API_TOKEN: "expected-token" });

		const response = await POST(post({ authorization: "Bearer wrong" }));

		expect(response.status).toBe(401);
		expect(mocks.generateYearlyExport).not.toHaveBeenCalled();
	});

	it("generates the export when the bearer token matches", async () => {
		mocks.generateYearlyExport.mockResolvedValue({ rowCount: 3 });
		const POST = await loadRoute({ EGAPRO_EXPORT_API_TOKEN: "expected-token" });

		const response = await POST(
			post({ authorization: "Bearer expected-token" }),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			success: true,
			year: 2026,
			rowCount: 3,
		});
		expect(mocks.generateYearlyExport).toHaveBeenCalledWith({}, 2026);
	});
});
