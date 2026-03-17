import { describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock("~/server/db", () => ({
	db: { select: mockSelect },
}));

const mockGetFile = vi.fn();
vi.mock("~/server/services/s3", () => ({
	getFile: mockGetFile,
}));

vi.mock("~/server/db/schema", () => ({
	exports: {
		fileName: "fileName",
		s3Key: "s3Key",
		date: "date",
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: vi.fn((a: unknown, b: unknown) => [a, b]),
}));

describe("GET /api/v1/export/declarations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 400 when date param is missing", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request("http://localhost/api/v1/export/declarations");
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toContain("date");
	});

	it("should return 400 when date format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date=2027-3-5",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
	});

	it("should return 404 when no export exists for date", async () => {
		mockLimit.mockResolvedValue([]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body.error).toContain("2027-03-15");
	});

	it("should stream CSV from S3 when export exists", async () => {
		mockLimit.mockResolvedValue([
			{
				fileName: "egapro_export_20270315.csv",
				s3Key: "exports/v1/2027-03-15.csv",
			},
		]);

		const csvContent = "SIREN,Raison_sociale\n123456789,ACME\n";
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode(csvContent));
				controller.close();
			},
		});
		mockGetFile.mockResolvedValue({ body: stream, contentType: "text/csv" });

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/csv");
		expect(response.headers.get("Content-Disposition")).toContain(
			"egapro_export_20270315.csv",
		);
		expect(response.headers.get("Cache-Control")).toContain("max-age=86400");
		expect(mockGetFile).toHaveBeenCalledWith("exports/v1/2027-03-15.csv");

		const text = await response.text();
		expect(text).toBe(csvContent);
	});
});
