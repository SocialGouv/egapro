import { beforeEach, describe, expect, it, vi } from "vitest";

const { EXPORT_TOKEN } = vi.hoisted(() => ({ EXPORT_TOKEN: "export-token" }));

const mocks = vi.hoisted(() => ({
	generateYearlyExport: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/modules/export", () => ({
	generateYearlyExport: mocks.generateYearlyExport,
}));
vi.mock("~/server/audit/log", () => ({ logAction: mocks.logAction }));
vi.mock("~/server/db", () => ({ db: {} }));
// Satisfies the bearer check on EGAPRO_EXPORT_API_TOKEN, so the handler runs.
vi.mock("~/env.js", () => ({
	env: { EGAPRO_EXPORT_API_TOKEN: EXPORT_TOKEN },
}));

import { POST } from "../route";

function request(query: string): Request {
	return new Request(`http://localhost/api/export/generate${query}`, {
		method: "POST",
		headers: { authorization: `Bearer ${EXPORT_TOKEN}` },
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
