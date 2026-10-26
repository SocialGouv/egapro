import { describe, expect, it, vi } from "vitest";

import {
	buildSession,
	CAMPAIGN_YEAR,
	createCaller,
	createMockDb,
	FRESH_ADMIN_MFA,
	installRouterTestEnv,
	SIREN,
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

const mockGetRepresentationWorkforceHistory = vi.fn();
vi.mock("~/server/db/getRepresentationWorkforceHistory", () => ({
	getRepresentationWorkforceHistory: (siren: string, year: number) =>
		mockGetRepresentationWorkforceHistory(siren, year),
}));

const HISTORY = [
	{ year: CAMPAIGN_YEAR, workforceEma: 1200 },
	{ year: CAMPAIGN_YEAR - 1, workforceEma: 1100 },
];

describe("representationDeclarationRouter.getWorkforceHistory", () => {
	installRouterTestEnv(mockGetRepresentationCampaign);

	it("returns the workforce history of the session company for the campaign", async () => {
		mockGetRepresentationWorkforceHistory.mockResolvedValue(HISTORY);

		const result = await createCaller(createMockDb().db).getWorkforceHistory({
			campaignYear: CAMPAIGN_YEAR,
		});

		expect(result).toEqual(HISTORY);
		expect(mockGetRepresentationWorkforceHistory).toHaveBeenCalledWith(
			SIREN,
			CAMPAIGN_YEAR,
		);
	});

	it("ignores a SIREN supplied by the client", async () => {
		mockGetRepresentationWorkforceHistory.mockResolvedValue([]);

		await createCaller(createMockDb().db).getWorkforceHistory({
			campaignYear: CAMPAIGN_YEAR,
			siren: "999999999",
		} as never);

		expect(mockGetRepresentationWorkforceHistory).toHaveBeenLastCalledWith(
			SIREN,
			CAMPAIGN_YEAR,
		);
	});

	it("reads the impersonated SIREN when an admin mimics a company", async () => {
		mockGetRepresentationWorkforceHistory.mockResolvedValue([]);
		const session = buildSession({
			isAdmin: true,
			adminMfaAt: FRESH_ADMIN_MFA,
			impersonation: { siren: "987654321" },
		});

		await createCaller(createMockDb().db, session).getWorkforceHistory({
			campaignYear: CAMPAIGN_YEAR,
		});

		expect(mockGetRepresentationWorkforceHistory).toHaveBeenLastCalledWith(
			"987654321",
			CAMPAIGN_YEAR,
		);
	});

	it("rejects a campaign year outside the accepted range", async () => {
		const caller = createCaller(createMockDb().db);

		await expect(
			caller.getWorkforceHistory({ campaignYear: 1999 }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("rejects a session without a usable SIRET", async () => {
		const caller = createCaller(
			createMockDb().db,
			buildSession({ siret: null }),
		);

		await expect(
			caller.getWorkforceHistory({ campaignYear: CAMPAIGN_YEAR }),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "SIRET manquant ou invalide dans la session",
		});
	});
});
