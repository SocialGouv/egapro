import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	env: {
		NEXT_PUBLIC_EGAPRO_ENV: "prod",
		NEXTAUTH_URL: "https://egapro.example",
	},
	countPublicCompanySirens: vi.fn(),
}));

vi.mock("~/env.js", () => ({ env: mocks.env }));
vi.mock("~/server/services/publicDeclarationsService", () => ({
	countPublicCompanySirens: mocks.countPublicCompanySirens,
}));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.env.NEXT_PUBLIC_EGAPRO_ENV = "prod";
});

describe("GET /sitemap.xml", () => {
	it("partitions company URLs into sitemaps of at most 50,000", async () => {
		mocks.countPublicCompanySirens.mockResolvedValue(50_001);
		const { GET } = await import("../route");

		const response = await GET();
		const xml = await response.text();

		expect(xml).toContain("/sitemaps/static.xml");
		expect(xml).toContain("/sitemaps/companies-1.xml");
		expect(xml).toContain("/sitemaps/companies-2.xml");
		expect(xml).not.toContain("/sitemaps/companies-3.xml");
	});

	it("keeps the static sitemap available when the database is down", async () => {
		mocks.countPublicCompanySirens.mockRejectedValue(new Error("db down"));
		const { GET } = await import("../route");

		const xml = await (await GET()).text();

		expect(xml).toContain("/sitemaps/static.xml");
		expect(xml).not.toContain("/sitemaps/companies-1.xml");
	});
});
