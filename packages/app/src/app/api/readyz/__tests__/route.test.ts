import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCheck } = vi.hoisted(() => ({ mockCheck: vi.fn() }));

vi.mock("~/server/db/readiness", () => ({
	checkDatabaseReadiness: mockCheck,
}));

import { dynamic, GET } from "../route";

describe("GET /api/readyz", () => {
	beforeEach(() => {
		mockCheck.mockReset();
	});

	it("is never cached by the platform, so each probe hits the database", () => {
		expect(dynamic).toBe("force-dynamic");
	});

	it("answers 200 when the database is reachable", async () => {
		mockCheck.mockResolvedValue(true);

		const response = await GET();

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("OK");
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it("answers 503 when the database is unreachable, without leaking why", async () => {
		mockCheck.mockResolvedValue(false);

		const response = await GET();

		expect(response.status).toBe(503);
		expect(await response.text()).toBe("unavailable");
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});
});
