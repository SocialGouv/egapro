import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/db/schema", () => ({
	users: {},
	companies: {},
	userCompanies: {},
}));
vi.mock("~/server/services/weez", () => ({ fetchCompanyBySiren: vi.fn() }));

import { authConfig } from "../config";

type OAuthProviderConfig = {
	id: string;
	authorization?: { params?: Record<string, string> };
};

describe("auth config — ProConnect provider", () => {
	it("requests the eidas2 substantial assurance level via acr_values", () => {
		const proconnect = (
			authConfig.providers as unknown as OAuthProviderConfig[]
		).find((provider) => provider.id === "proconnect");

		expect(proconnect).toBeDefined();
		expect(proconnect?.authorization?.params?.acr_values).toBe("eidas2");
	});
});
