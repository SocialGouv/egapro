import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchCseFiles = vi.fn().mockResolvedValue(new Map());
const mockFetchJointFiles = vi.fn().mockResolvedValue(new Map());
const mockFetchFileById = vi.fn().mockResolvedValue(undefined);

vi.mock("~/modules/export/queries", () => ({
	fetchCseFilesByDeclaration: (...args: unknown[]) =>
		mockFetchCseFiles(...args),
	fetchJointEvaluationFilesByDeclaration: (...args: unknown[]) =>
		mockFetchJointFiles(...args),
	fetchFileById: (...args: unknown[]) => mockFetchFileById(...args),
	fetchSubmittedDeclarations: vi.fn().mockResolvedValue([]),
	fetchCategoriesByDeclaration: vi.fn().mockResolvedValue(new Map()),
	fetchIndicatorGByDeclaration: vi.fn().mockResolvedValue(new Map()),
	fetchCseOpinionsByDeclaration: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock("~/server/services/s3", () => ({
	getFile: vi.fn().mockResolvedValue({
		body: new ReadableStream(),
		contentType: "application/pdf",
	}),
}));

describe("GET /api/v1/files", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchCseFiles.mockResolvedValue(new Map());
		mockFetchJointFiles.mockResolvedValue(new Map());
	});

	it("should return 400 when siren is missing", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = new Request("http://localhost/api/v1/files?year=2027");
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toContain("siren");
	});

	it("should return 400 when siren format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = new Request(
			"http://localhost/api/v1/files?siren=123&year=2027",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
	});

	it("should return 400 when year is missing", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = new Request(
			"http://localhost/api/v1/files?siren=123456789",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
	});

	it("should return empty files array when no files exist", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = new Request(
			"http://localhost/api/v1/files?siren=123456789&year=2027",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.siren).toBe("123456789");
		expect(body.year).toBe(2027);
		expect(body.files).toEqual([]);
	});

	it("should return CSE and joint evaluation files with correct types", async () => {
		mockFetchCseFiles.mockResolvedValue(
			new Map([
				[
					"123456789-2027",
					[
						{
							id: "cse-1",
							siren: "123456789",
							year: 2027,
							fileName: "avis-cse.pdf",
							filePath: "123456789/2027/abc.pdf",
							uploadedAt: new Date("2027-03-10T08:00:00Z"),
						},
					],
				],
			]),
		);
		mockFetchJointFiles.mockResolvedValue(
			new Map([
				[
					"123456789-2027",
					[
						{
							id: "joint-1",
							siren: "123456789",
							year: 2027,
							fileName: "evaluation.pdf",
							filePath: "123456789/2027/def.pdf",
							uploadedAt: new Date("2027-03-12T09:00:00Z"),
						},
					],
				],
			]),
		);

		const { GET } = await import("~/app/api/v1/files/route");
		const request = new Request(
			"http://localhost/api/v1/files?siren=123456789&year=2027",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.files).toHaveLength(2);
		expect(body.files[0]).toEqual({
			id: "cse-1",
			type: "cse_opinion",
			fileName: "avis-cse.pdf",
			uploadedAt: "2027-03-10T08:00:00.000Z",
		});
		expect(body.files[1]).toEqual({
			id: "joint-1",
			type: "joint_evaluation",
			fileName: "evaluation.pdf",
			uploadedAt: "2027-03-12T09:00:00.000Z",
		});
	});

	it("should call queries with correct siren and year", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = new Request(
			"http://localhost/api/v1/files?siren=987654321&year=2026",
		);
		await GET(request);

		const expectedKey = [{ siren: "987654321", year: 2026 }];
		expect(mockFetchCseFiles).toHaveBeenCalledWith(expectedKey);
		expect(mockFetchJointFiles).toHaveBeenCalledWith(expectedKey);
	});
});

describe("GET /api/v1/files/:fileId", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchFileById.mockResolvedValue(undefined);
	});

	it("should return 404 when file does not exist", async () => {
		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = new Request("http://localhost/api/v1/files/nonexistent");
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "nonexistent" }),
		});

		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body.error).toContain("non trouvé");
	});

	it("should stream file from S3 when file exists", async () => {
		mockFetchFileById.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse.pdf",
		});

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = new Request("http://localhost/api/v1/files/file-1");
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			'attachment; filename="avis-cse.pdf"',
		);
	});

	it("should return 500 when S3 throws", async () => {
		mockFetchFileById.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse.pdf",
		});

		const { getFile } = await import("~/server/services/s3");
		vi.mocked(getFile).mockRejectedValueOnce(new Error("S3 error"));

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = new Request("http://localhost/api/v1/files/file-1");
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(500);
	});
});
