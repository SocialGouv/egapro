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

const mockBuildIndicatorGRows = vi.fn();
vi.mock("../queries", () => ({
	buildIndicatorGRows: (...args: unknown[]) => mockBuildIndicatorGRows(...args),
}));

const mockGenerateXlsx = vi.fn();
vi.mock("../generateXlsx", () => ({
	generateXlsx: (...args: unknown[]) => mockGenerateXlsx(...args),
}));

describe("generateYearlyExport", () => {
	const mockLimit = vi.fn();
	const mockUpdateWhere = vi.fn();
	const mockSelectWhere = vi.fn(() => ({ limit: mockLimit }));
	const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
	const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));
	const mockValues = vi.fn();
	const mockInsert = vi.fn(() => ({ values: mockValues }));
	const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
	const mockUpdate = vi.fn(() => ({ set: mockSet }));

	const mockDb = {
		select: mockSelect,
		insert: mockInsert,
		update: mockUpdate,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockGenerateXlsx.mockResolvedValue(Buffer.from("fake-xlsx"));
	});

	it("should generate XLSX, upload to S3, and insert metadata for new year", async () => {
		mockLimit.mockResolvedValue([]);
		mockBuildExportRows.mockResolvedValue([
			{ siren: "123456789", companyName: "Test" },
		]);
		mockBuildIndicatorGRows.mockResolvedValue([
			{ siren: "123456789", categoryName: "Ouvriers" },
		]);

		const { generateYearlyExport } = await import("../generateYearlyExport");
		const result = await generateYearlyExport(mockDb as never, 2027);

		expect(result.rowCount).toBe(1);
		expect(result.indicatorGRowCount).toBe(1);
		expect(result.fileName).toBe("egapro_export_2027.xlsx");
		expect(mockEnsureBucket).toHaveBeenCalledOnce();
		expect(mockUploadFile).toHaveBeenCalledWith(
			"exports/v1/2027.xlsx",
			expect.any(Buffer),
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
		expect(mockValues).toHaveBeenCalledWith(
			expect.objectContaining({ generatedAt: expect.any(Date) }),
		);
	});

	it("should update metadata when export already exists for year", async () => {
		mockLimit.mockResolvedValue([{ id: "existing-id" }]);
		mockBuildExportRows.mockResolvedValue([]);
		mockBuildIndicatorGRows.mockResolvedValue([]);

		const { generateYearlyExport } = await import("../generateYearlyExport");
		const result = await generateYearlyExport(mockDb as never, 2027);

		expect(result.rowCount).toBe(0);
		expect(mockUploadFile).toHaveBeenCalled();
		// The supervision probe reads `generated_at`: it must move on every
		// regeneration, unlike the insert-only `created_at` (#5197).
		expect(mockSet).toHaveBeenCalledWith(
			expect.objectContaining({ generatedAt: expect.any(Date) }),
		);
		expect(mockInsert).not.toHaveBeenCalled();
	});
});
