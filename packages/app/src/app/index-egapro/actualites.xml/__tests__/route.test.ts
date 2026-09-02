import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	enforcePublicApiRateLimit: vi.fn(),
	listRecentPublicDeclarations: vi.fn(),
}));

vi.mock("~/server/services/publicApiRateLimit", () => ({
	enforcePublicApiRateLimit: mocks.enforcePublicApiRateLimit,
}));
vi.mock("~/server/services/publicDeclarationsService", () => ({
	listRecentPublicDeclarations: mocks.listRecentPublicDeclarations,
}));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.enforcePublicApiRateLimit.mockResolvedValue(null);
	mocks.listRecentPublicDeclarations.mockResolvedValue([
		{
			siren: "123456789",
			name: "A & B",
			year: 2025,
			publishedAt: new Date("2026-08-31T10:00:00Z"),
		},
	]);
});

describe("GET /index-egapro/actualites.xml", () => {
	it("returns the 50 latest companies as escaped RSS", async () => {
		const { GET } = await import("../route");

		const response = await GET(
			new Request("https://egapro.example/index-egapro/actualites.xml"),
		);

		expect(mocks.listRecentPublicDeclarations).toHaveBeenCalledWith(50);
		expect(response.headers.get("Content-Type")).toContain(
			"application/rss+xml",
		);
		const xml = await response.text();
		expect(xml).toContain("A &amp; B — résultats 2025");
		expect(xml).toContain(
			"https://egapro.example/index-egapro/entreprise/123456789?year=2025",
		);
		expect(xml).toContain("<pubDate>Mon, 31 Aug 2026 10:00:00 GMT</pubDate>");
		expect(xml).toContain(
			"<lastBuildDate>Mon, 31 Aug 2026 10:00:00 GMT</lastBuildDate>",
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
		expect(mocks.listRecentPublicDeclarations).not.toHaveBeenCalled();
	});
});
