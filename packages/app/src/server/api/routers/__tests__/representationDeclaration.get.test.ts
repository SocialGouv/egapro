import { describe, expect, it, vi } from "vitest";

import { REPRESENTATION_YEAR as YEAR } from "~/modules/declaration-representation/__tests__/fixtures";
import {
	buildSession,
	CAMPAIGN_YEAR,
	CLOSED_CAMPAIGN,
	createCaller,
	createMockDb,
	installRouterTestEnv,
	SIREN,
	whereParams,
} from "./representationDeclarationHarness";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const mockGetRepresentationCampaign = vi.fn();
vi.mock("~/server/db/getRepresentationCampaign", () => ({
	getRepresentationCampaign: (year: number) =>
		mockGetRepresentationCampaign(year),
}));

describe("representationDeclarationRouter.get", () => {
	installRouterTestEnv(mockGetRepresentationCampaign);

	it("returns the declaration of the company alongside an open campaign", async () => {
		const row = { id: "repr-1", siren: SIREN, year: YEAR, status: "draft" };
		const mock = createMockDb([row]);

		const result = await createCaller(mock.db).get({ year: YEAR });

		expect(result).toEqual({ declaration: row, campaignOpen: true });
	});

	it("returns no declaration when the company has not started one", async () => {
		const mock = createMockDb([]);

		const result = await createCaller(mock.db).get({ year: YEAR });

		expect(result.declaration).toBeNull();
	});

	it("flags the campaign as closed outside its window", async () => {
		mockGetRepresentationCampaign.mockResolvedValue(CLOSED_CAMPAIGN);
		const mock = createMockDb([]);

		const result = await createCaller(mock.db).get({ year: YEAR });

		expect(result.campaignOpen).toBe(false);
	});

	it("resolves the campaign of the year following the declared year", async () => {
		const mock = createMockDb([]);

		await createCaller(mock.db).get({ year: YEAR });

		expect(mockGetRepresentationCampaign).toHaveBeenCalledWith(CAMPAIGN_YEAR);
	});

	it("scopes the lookup to the SIREN of the session", async () => {
		const mock = createMockDb([]);

		await createCaller(mock.db).get({ year: YEAR });

		expect(whereParams(mock)).toEqual([SIREN, YEAR]);
	});

	it("ignores a SIREN supplied by the client", async () => {
		const mock = createMockDb([]);

		await createCaller(mock.db).get({
			year: YEAR,
			siren: "999999999",
		} as never);

		expect(whereParams(mock)).toEqual([SIREN, YEAR]);
	});

	it("reads the impersonated SIREN when an admin mimics a company", async () => {
		const mock = createMockDb([]);
		const session = buildSession({
			isAdmin: true,
			impersonation: { siren: "987654321" },
		});

		await createCaller(mock.db, session).get({ year: YEAR });

		expect(whereParams(mock)).toEqual(["987654321", YEAR]);
	});

	it("rejects a session without a usable SIRET", async () => {
		const mock = createMockDb([]);
		const caller = createCaller(mock.db, buildSession({ siret: null }));

		await expect(caller.get({ year: YEAR })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "SIRET manquant ou invalide dans la session",
		});
	});
});
