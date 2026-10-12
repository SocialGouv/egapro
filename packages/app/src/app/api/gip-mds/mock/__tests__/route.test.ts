import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		NEXT_PUBLIC_EGAPRO_ENV: "dev" as "dev" | "preprod" | "prod",
	},
}));

vi.mock("~/env.js", () => ({ env: mockEnv }));

import { GET } from "../route";

describe("GET /api/gip-mds/mock", () => {
	beforeEach(() => {
		mockEnv.NEXT_PUBLIC_EGAPRO_ENV = "dev";
	});

	it("serves the mock CSV on dev builds (local, E2E, review apps)", async () => {
		const response = await GET();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"text/csv; charset=utf-8",
		);
		expect((await response.text()).length).toBeGreaterThan(0);
	});

	it.each(["preprod", "prod"] as const)("answers 404 on %s", async (target) => {
		mockEnv.NEXT_PUBLIC_EGAPRO_ENV = target;

		const response = await GET();

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("");
	});
});
