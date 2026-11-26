import { describe, expect, it } from "vitest";

import { GET } from "../route";

describe("GET /api/v1/healthz", () => {
	it("answers 200 with a constant body, for the supervision probe", async () => {
		const response = GET();

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("OK");
	});
});
