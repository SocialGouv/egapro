import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: { NEXT_PUBLIC_EGAPRO_ENV: "dev" as string },
}));

vi.mock("~/env.js", () => ({ env: mockEnv }));

import { GET } from "../route";

const NONCE = "q1w2e3r4t5y6u7i8o9p0Aw==";

function requestWithNonce(nonce?: string) {
	return new NextRequest("http://localhost/api/v1/docs", {
		headers: nonce === undefined ? {} : { "x-nonce": nonce },
	});
}

function scriptTagsOf(html: string) {
	return html.match(/<script\b[^>]*>/g) ?? [];
}

describe("GET /api/v1/docs", () => {
	beforeEach(() => {
		mockEnv.NEXT_PUBLIC_EGAPRO_ENV = "dev";
	});

	it("stamps the request nonce on every script, so the CSP lets Swagger UI run", async () => {
		const html = await GET(requestWithNonce(NONCE)).text();

		const tags = scriptTagsOf(html);
		expect(tags).toHaveLength(3);
		for (const tag of tags) {
			expect(tag).toContain(`nonce="${NONCE}"`);
		}
	});

	it("drops a nonce that is not base64 rather than writing it into the HTML", async () => {
		const html = await GET(
			requestWithNonce('"><img src=x onerror=alert(1)>'),
		).text();

		expect(html).not.toContain("onerror");
		for (const tag of scriptTagsOf(html)) {
			expect(tag).toContain('nonce=""');
		}
	});

	it("is not served in production", () => {
		mockEnv.NEXT_PUBLIC_EGAPRO_ENV = "prod";

		expect(GET(requestWithNonce(NONCE)).status).toBe(404);
	});
});
