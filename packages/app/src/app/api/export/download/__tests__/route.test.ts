import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	downloadExport: vi.fn(),
}));

vi.mock("~/modules/export/downloadExport", () => ({
	downloadExport: mocks.downloadExport,
}));

vi.mock("~/server/db", () => ({ db: {} }));

const audited = vi.hoisted(() => ({
	config: undefined as
		| { resolveContext: (request: Request) => { metadata: unknown } }
		| undefined,
}));

vi.mock("~/server/audit/withAuditedRoute", () => ({
	withAuditedRoute: (
		config: typeof audited.config,
		handler: unknown,
	) => {
		audited.config = config;
		return handler;
	},
}));

vi.mock("~/modules/audit", () => ({
	AUDIT_ACTIONS: { EXPORT_DOWNLOAD: "export.download" },
}));

async function loadRoute(envOverrides: Record<string, string | undefined>) {
	vi.resetModules();
	vi.doMock("~/env.js", () => ({ env: envOverrides }));

	const { GET } = await import("../route");
	return GET;
}

function get(headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/export/download?year=2026", {
		method: "GET",
		headers,
	});
}

afterEach(() => {
	vi.doUnmock("~/env.js");
	vi.resetModules();
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

describe("GET /api/export/download", () => {
	it("refuses when the token is not configured, instead of skipping the check", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const GET = await loadRoute({ EGAPRO_EXPORT_API_TOKEN: undefined });

		const response = await GET(get());

		expect(response.status).toBe(401);
		expect(mocks.downloadExport).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalled();
	});

	it("rejects an anonymous call", async () => {
		const GET = await loadRoute({ EGAPRO_EXPORT_API_TOKEN: "expected-token" });

		const response = await GET(get());

		expect(response.status).toBe(401);
		expect(mocks.downloadExport).not.toHaveBeenCalled();
	});

	it("rejects a wrong bearer token", async () => {
		const GET = await loadRoute({ EGAPRO_EXPORT_API_TOKEN: "expected-token" });

		const response = await GET(get({ authorization: "Bearer wrong" }));

		expect(response.status).toBe(401);
		expect(mocks.downloadExport).not.toHaveBeenCalled();
	});

	it("streams the export when the bearer token matches", async () => {
		mocks.downloadExport.mockResolvedValue({
			found: true,
			fileName: "egapro_export_2026.xlsx",
			body: "xlsx-bytes",
			contentType:
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});
		const GET = await loadRoute({ EGAPRO_EXPORT_API_TOKEN: "expected-token" });

		const response = await GET(get({ authorization: "Bearer expected-token" }));

		expect(response.status).toBe(200);
		expect(response.headers.get("content-disposition")).toBe(
			'attachment; filename="egapro_export_2026.xlsx"',
		);
		await expect(response.text()).resolves.toBe("xlsx-bytes");
		expect(mocks.downloadExport).toHaveBeenCalledWith({}, 2026);
	});

	it("returns 404 when no export exists for the year", async () => {
		mocks.downloadExport.mockResolvedValue({ found: false });
		const GET = await loadRoute({ EGAPRO_EXPORT_API_TOKEN: "expected-token" });

		const response = await GET(get({ authorization: "Bearer expected-token" }));

		expect(response.status).toBe(404);
	});

	it("keeps only a well-formed year in the audit metadata", async () => {
		await loadRoute({ EGAPRO_EXPORT_API_TOKEN: "secret-token" });
		const resolve = (query: string) =>
			audited.config?.resolveContext(
				new Request(`http://localhost/api/export/download${query}`),
			).metadata;

		expect(resolve("?year=2026")).toEqual({ year: 2026 });
		expect(resolve(`?year=${"x".repeat(10_000)}`)).toEqual({ year: null });
		expect(resolve("")).toEqual({ year: null });
	});
});
