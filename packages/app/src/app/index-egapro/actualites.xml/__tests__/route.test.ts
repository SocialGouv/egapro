import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	enforcePublicApiRateLimit: vi.fn(),
	searchPublicDeclarations: vi.fn(),
}));

vi.mock("~/server/services/publicApiRateLimit", () => ({
	enforcePublicApiRateLimit: mocks.enforcePublicApiRateLimit,
}));
vi.mock("~/server/services/publicDeclarationsService", () => ({
	searchPublicDeclarations: mocks.searchPublicDeclarations,
}));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.enforcePublicApiRateLimit.mockResolvedValue(null);
	mocks.searchPublicDeclarations.mockResolvedValue({
		count: 1,
		data: [{ siren: "123456789", name: "A & B", year: 2025 }],
	});
});

describe("GET /index-egapro/actualites.xml", () => {
	it("returns the 50 latest companies as escaped RSS", async () => {
		const { GET } = await import("../route");

		const response = await GET(
			new Request("https://egapro.example/index-egapro/actualites.xml"),
		);

		expect(mocks.searchPublicDeclarations).toHaveBeenCalledWith({
			limit: 50,
			offset: 0,
			sort: "year",
		});
		expect(response.headers.get("Content-Type")).toContain(
			"application/rss+xml",
		);
		const xml = await response.text();
		expect(xml).toContain("A &amp; B — résultats 2025");
		expect(xml).toContain(
			"https://egapro.example/index-egapro/entreprise/123456789",
		);
	});

	it("returns the limiter response without querying declarations", async () => {
		mocks.enforcePublicApiRateLimit.mockResolvedValue(
			new Response("limited", { status: 429 }),
		);
		const { GET } = await import("../route");

		const response = await GET(
			new Request("https://egapro.example/index-egapro/actualites.xml"),
		);

		expect(response.status).toBe(429);
		expect(mocks.searchPublicDeclarations).not.toHaveBeenCalled();
	});
});
