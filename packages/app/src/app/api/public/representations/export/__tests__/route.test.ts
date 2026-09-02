import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	buildRows: vi.fn(),
	generateCsv: vi.fn(),
	generateXlsx: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/modules/export", () => ({
	buildRepresentationExportRows: mocks.buildRows,
	generateRepresentationCsv: mocks.generateCsv,
	generateRepresentationXlsx: mocks.generateXlsx,
}));

vi.mock("~/server/audit/log", () => ({ logAction: mocks.logAction }));
vi.mock("~/server/db", () => ({ db: {} }));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.buildRows.mockResolvedValue([]);
	mocks.generateCsv.mockReturnValue("header");
	mocks.generateXlsx.mockResolvedValue(Buffer.from("xlsx"));
});

async function callGet(search = "") {
	const { GET } = await import("../route");
	return GET(
		new Request(`http://localhost/api/public/representations/export${search}`),
	);
}

describe("GET /api/public/representations/export", () => {
	it("uses the stable public filename for CSV downloads", async () => {
		const response = await callGet("?format=csv");

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Disposition")).toContain(
			"index-egapro-representations-equilibrees.csv",
		);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Cache-Control")).toContain("max-age=3600");
	});

	it("uses the stable public filename for XLSX downloads", async () => {
		const response = await callGet();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Disposition")).toContain(
			"index-egapro-representations-equilibrees.xlsx",
		);
		expect((await response.arrayBuffer()).byteLength).toBe(4);
	});

	it("returns a CORS-readable validation error", async () => {
		const response = await callGet("?format=json");

		expect(response.status).toBe(400);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(mocks.buildRows).not.toHaveBeenCalled();
	});
});

describe("OPTIONS /api/public/representations/export", () => {
	it("returns the shared export headers", async () => {
		const { OPTIONS } = await import("../route");

		const response = OPTIONS();

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
			"GET, OPTIONS",
		);
		expect(response.headers.get("Cache-Control")).toContain("max-age=3600");
	});
});
