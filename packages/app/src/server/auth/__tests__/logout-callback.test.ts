import type { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

const { GET } = await import("~/app/api/auth/logout-callback/route");

function buildRequest(state?: string, cookieState?: string) {
	const url = state
		? `http://localhost:3000/api/auth/logout-callback?state=${state}`
		: "http://localhost:3000/api/auth/logout-callback";

	const request = new Request(url) as unknown as NextRequest;

	// Mock nextUrl for Next.js
	Object.defineProperty(request, "nextUrl", {
		value: new URL(url),
	});

	// Mock cookies
	Object.defineProperty(request, "cookies", {
		value: {
			get: (name: string) =>
				name === "proconnect-logout-state" && cookieState
					? { value: cookieState }
					: undefined,
		},
	});

	return request;
}

describe("GET /api/auth/logout-callback", () => {
	it("redirects to the home page with valid state", () => {
		const response = GET(buildRequest("abc123", "abc123"));

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
	});

	it("clears the state cookie", () => {
		const response = GET(buildRequest("abc123", "abc123"));

		const setCookie = response.headers.get("set-cookie") ?? "";
		expect(setCookie).toContain("proconnect-logout-state");
		expect(setCookie).toContain("Expires=Thu, 01 Jan 1970");
	});

	it("still redirects home on state mismatch", () => {
		const response = GET(buildRequest("abc123", "different"));

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
	});

	it("still redirects home when state cookie is missing", () => {
		const response = GET(buildRequest("abc123"));

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
	});

	it("still redirects home when query state is missing", () => {
		const response = GET(buildRequest(undefined, "abc123"));

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
	});
});
