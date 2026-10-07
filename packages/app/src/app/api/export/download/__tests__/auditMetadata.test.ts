import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	downloadExport: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/modules/export/downloadExport", () => ({
	downloadExport: mocks.downloadExport,
}));
vi.mock("~/server/audit/log", () => ({ logAction: mocks.logAction }));
vi.mock("~/server/db", () => ({ db: {} }));

import { GET } from "../route";

function request(query: string): Request {
	return new Request(`http://localhost/api/export/download${query}`);
}

describe("GET /api/export/download — audit metadata", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.downloadExport.mockResolvedValue({ found: false });
	});

	it("audits the validated year as a number", async () => {
		await GET(request("?year=2027"));

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ metadata: { year: 2027 } }),
		);
	});

	it("audits an invalid year by name only, never the raw value", async () => {
		const response = await GET(request(`?year=${"x".repeat(5_000)}`));

		expect(response.status).toBe(400);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ metadata: { invalidParam: "year" } }),
		);
	});
});
