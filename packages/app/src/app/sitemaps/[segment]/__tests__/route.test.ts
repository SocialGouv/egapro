import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	env: {
		NEXT_PUBLIC_EGAPRO_ENV: "prod",
		NEXTAUTH_URL: "https://egapro.example",
	},
	buildSitemap: vi.fn(),
	listPublicCompanySirens: vi.fn(),
}));

vi.mock("~/env.js", () => ({ env: mocks.env }));
vi.mock("~/modules/legal", () => ({ buildSitemap: mocks.buildSitemap }));
vi.mock("~/server/services/publicDeclarationsService", () => ({
	listPublicCompanySirens: mocks.listPublicCompanySirens,
}));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.env.NEXT_PUBLIC_EGAPRO_ENV = "prod";
});

describe("GET /sitemaps/[segment]", () => {
	it("requests the correct 50,000-company slice", async () => {
		mocks.listPublicCompanySirens.mockResolvedValue(["123456789"]);
		const { GET } = await import("../route");

		const response = await GET(new Request("https://egapro.example"), {
			params: Promise.resolve({ segment: "companies-2.xml" }),
		});

		expect(mocks.listPublicCompanySirens).toHaveBeenCalledWith(50_000, 50_000);
		expect(await response.text()).toContain(
			"/index-egapro/entreprise/123456789",
		);
	});

	it("returns 404 for an unknown segment", async () => {
		const { GET } = await import("../route");

		const response = await GET(new Request("https://egapro.example"), {
			params: Promise.resolve({ segment: "unknown.xml" }),
		});

		expect(response.status).toBe(404);
	});
});
