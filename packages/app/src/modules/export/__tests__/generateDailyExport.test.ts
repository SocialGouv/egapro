import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockUploadFile = vi.fn();
const mockEnsureBucket = vi.fn();
vi.mock("~/server/services/s3", () => ({
	uploadFile: (...args: unknown[]) => mockUploadFile(...args),
	ensureBucket: () => mockEnsureBucket(),
}));

const mockBuildExportRows = vi.fn();
vi.mock("../buildExportRows", () => ({
	buildExportRows: (...args: unknown[]) => mockBuildExportRows(...args),
}));

describe("generateDailyExport", () => {
	const mockLimit = vi.fn();
	const mockWhere = vi.fn(() => ({ limit: mockLimit }));
	const mockFrom = vi.fn(() => ({ where: mockWhere }));
	const mockSelect = vi.fn(() => ({ from: mockFrom }));
	const mockValues = vi.fn();
	const mockInsert = vi.fn(() => ({ values: mockValues }));

	const mockDb = {
		select: mockSelect,
		insert: mockInsert,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should skip generation if export already exists", async () => {
		mockLimit.mockResolvedValue([{ id: "existing-id" }]);

		const { generateDailyExport } = await import("../generateDailyExport");
		const result = await generateDailyExport(mockDb as never, "2027-03-15");

		expect(result.alreadyExists).toBe(true);
		expect(result.rowCount).toBe(0);
		expect(mockUploadFile).not.toHaveBeenCalled();
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it("should generate CSV, upload to S3, and store metadata", async () => {
		mockLimit.mockResolvedValue([]);
		mockBuildExportRows.mockResolvedValue([
			{ siren: "123456789", companyName: "Test" },
		]);

		const { generateDailyExport } = await import("../generateDailyExport");
		const result = await generateDailyExport(mockDb as never, "2027-03-15");

		expect(result.alreadyExists).toBe(false);
		expect(result.rowCount).toBe(1);
		expect(result.fileName).toBe("egapro_export_20270315.csv");
		expect(mockEnsureBucket).toHaveBeenCalledOnce();
		expect(mockUploadFile).toHaveBeenCalledWith(
			"exports/v1/2027-03-15.csv",
			expect.any(Buffer),
			"text/csv",
		);
		expect(mockInsert).toHaveBeenCalled();
		expect(mockValues).toHaveBeenCalledWith(
			expect.objectContaining({
				date: "2027-03-15",
				s3Key: "exports/v1/2027-03-15.csv",
				rowCount: 1,
			}),
		);
	});

	it("should generate export with zero rows when no declarations found", async () => {
		mockLimit.mockResolvedValue([]);
		mockBuildExportRows.mockResolvedValue([]);

		const { generateDailyExport } = await import("../generateDailyExport");
		const result = await generateDailyExport(mockDb as never, "2027-03-15");

		expect(result.alreadyExists).toBe(false);
		expect(result.rowCount).toBe(0);
		expect(mockUploadFile).toHaveBeenCalled();
	});
});
