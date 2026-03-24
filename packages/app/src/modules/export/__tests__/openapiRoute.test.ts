import { beforeEach, describe, expect, it, vi } from "vitest";

describe("GET /api/v1/openapi.json", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("should return the OpenAPI spec as JSON", async () => {
		vi.doMock("~/env", () => ({
			env: { NEXT_PUBLIC_EGAPRO_ENV: "dev" },
		}));

		const { GET } = await import("~/app/api/v1/openapi.json/route");
		const response = GET();

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.openapi).toBe("3.1.0");
		expect(body.paths).toBeDefined();
	});

	it("should return 404 in production", async () => {
		vi.doMock("~/env", () => ({
			env: { NEXT_PUBLIC_EGAPRO_ENV: "prod" },
		}));

		const { GET } = await import("~/app/api/v1/openapi.json/route");
		const response = GET();

		expect(response.status).toBe(404);
	});

	it("should set CORS and cache headers", async () => {
		vi.doMock("~/env", () => ({
			env: { NEXT_PUBLIC_EGAPRO_ENV: "dev" },
		}));

		const { GET } = await import("~/app/api/v1/openapi.json/route");
		const response = GET();

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=3600, must-revalidate",
		);
	});
});
