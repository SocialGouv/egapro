import { beforeEach, describe, expect, it, vi } from "vitest";

const { EXPORT_TOKEN } = vi.hoisted(() => ({ EXPORT_TOKEN: "export-token" }));

const mocks = vi.hoisted(() => ({
	downloadExport: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/modules/export/downloadExport", () => ({
	downloadExport: mocks.downloadExport,
}));
vi.mock("~/server/audit/log", () => ({ logAction: mocks.logAction }));
vi.mock("~/server/db", () => ({ db: {} }));
// Satisfies the bearer check on EGAPRO_EXPORT_API_TOKEN, so the handler runs.
vi.mock("~/env.js", () => ({
	env: { EGAPRO_EXPORT_API_TOKEN: EXPORT_TOKEN },
}));

import { GET } from "../route";

function request(query: string): Request {
	return new Request(`http://localhost/api/export/download${query}`, {
		headers: { authorization: `Bearer ${EXPORT_TOKEN}` },
	});
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
