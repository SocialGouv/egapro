import { describe, expect, it } from "vitest";

import { GET, OPTIONS } from "../route";

describe("GET /api/public/openapi.json", () => {
	it("returns the public OpenAPI spec as JSON", async () => {
		const response = GET();

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.openapi).toBe("3.1.0");
		expect(body.info.title).toBe("EGAPRO — API publique");
		expect(body.paths["/api/public/declarations"]).toBeDefined();
	});

	it("sets open CORS and one-hour cache headers", () => {
		const response = GET();

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
			"GET, OPTIONS",
		);
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=3600, must-revalidate",
		);
	});
});

describe("OPTIONS /api/public/openapi.json", () => {
	it("answers the preflight with 204 and the CORS headers", () => {
		const response = OPTIONS();

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
			"GET, OPTIONS",
		);
		expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
			"Content-Type",
		);
	});
});
