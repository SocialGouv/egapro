import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/server/services/s3", () => ({
	uploadFile: vi.fn(),
	ensureBucket: vi.fn(),
}));

describe("buildExportKey", () => {
	it("should build correct S3 key", async () => {
		const { buildExportKey } = await import("../generateDailyExport");
		expect(buildExportKey("2027-03-15", "v1")).toBe(
			"exports/v1/2027-03-15.csv",
		);
	});

	it("should use version in the key path", async () => {
		const { buildExportKey } = await import("../generateDailyExport");
		expect(buildExportKey("2027-03-15", "v2")).toBe(
			"exports/v2/2027-03-15.csv",
		);
	});
});
