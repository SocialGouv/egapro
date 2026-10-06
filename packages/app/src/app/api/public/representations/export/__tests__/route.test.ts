import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_EXPORT_ROWS, MAX_XLSX_EXPORT_ROWS } from "~/modules/public-api";
import { createFakeValkey } from "~/test/fakeValkey";

const mocks = vi.hoisted(() => ({
	buildRows: vi.fn(),
	generateCsv: vi.fn(),
	generateXlsx: vi.fn(),
	logAction: vi.fn(),
	getValkey: vi.fn(),
}));

vi.mock("~/server/services/valkey", async () =>
	(await import("~/test/fakeValkey")).mockValkeyModule(mocks.getValkey),
);

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
	mocks.getValkey.mockResolvedValue(null);
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

	it("passes repeated observatory facets to the export query", async () => {
		const response = await callGet(
			"?format=csv&region=11&region=84&naf=C&workforceRanges=1000%2B",
		);

		expect(response.status).toBe(200);
		expect(mocks.buildRows).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({
				region: ["11", "84"],
				naf: ["C"],
				workforceRanges: ["1000+"],
			}),
			MAX_EXPORT_ROWS + 1,
		);
	});

	it("answers 413 once a CSV export exceeds its safety cap", async () => {
		mocks.buildRows.mockResolvedValue(new Array(MAX_EXPORT_ROWS + 1));

		const response = await callGet("?format=csv");

		expect(response.status).toBe(413);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(mocks.generateCsv).not.toHaveBeenCalled();
	});

	it("caps Excel downloads like the declarations export", async () => {
		mocks.buildRows.mockResolvedValue(new Array(MAX_XLSX_EXPORT_ROWS + 1));

		const response = await callGet();

		expect(mocks.buildRows).toHaveBeenCalledWith(
			expect.any(Object),
			expect.any(Object),
			MAX_XLSX_EXPORT_ROWS + 1,
		);
		expect(response.status).toBe(413);
		expect(mocks.generateXlsx).not.toHaveBeenCalled();
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

describe("GET /api/public/representations/export — server-side cache", () => {
	it("serves an equivalent CSV query from the cache without querying the database", async () => {
		mocks.getValkey.mockResolvedValue(createFakeValkey());
		mocks.generateCsv.mockReturnValue('"SIREN"\n"123456789"');
		await callGet("?format=csv&region=11&region=84");
		mocks.buildRows.mockClear();

		const response = await callGet("?region=84&format=csv&page=2&region=11");

		expect(mocks.buildRows).not.toHaveBeenCalled();
		expect(response.headers.get("Content-Disposition")).toContain(
			"index-egapro-representations-equilibrees.csv",
		);
		expect(await response.text()).toBe('"SIREN"\n"123456789"');
	});

	it("does not cache Excel workbooks", async () => {
		const valkey = createFakeValkey();
		mocks.getValkey.mockResolvedValue(valkey);

		await callGet();
		await callGet();

		expect(valkey.set).not.toHaveBeenCalled();
		expect(mocks.buildRows).toHaveBeenCalledTimes(2);
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
