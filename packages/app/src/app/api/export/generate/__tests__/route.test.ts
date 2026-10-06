import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	generateYearlyExport: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/modules/export", () => ({
	generateYearlyExport: mocks.generateYearlyExport,
}));
vi.mock("~/server/audit/log", () => ({ logAction: mocks.logAction }));
vi.mock("~/server/db", () => ({ db: {} }));

import { POST } from "../route";

function request(query: string): Request {
	return new Request(`http://localhost/api/export/generate${query}`, {
		method: "POST",
	});
}

describe("POST /api/export/generate — audit metadata", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.generateYearlyExport.mockResolvedValue({});
	});

	it("audits the validated year as a number", async () => {
		await POST(request("?year=2027"));

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ metadata: { year: 2027 } }),
		);
	});

	it("audits no year when none is requested", async () => {
		await POST(request(""));

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ metadata: { year: null } }),
		);
	});

	it("audits an invalid year by name only, never the raw value", async () => {
		const response = await POST(request(`?year=${"x".repeat(5_000)}`));

		expect(response.status).toBe(400);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ metadata: { invalidParam: "year" } }),
		);
	});
});
