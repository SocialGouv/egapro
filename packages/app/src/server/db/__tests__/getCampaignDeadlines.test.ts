import { beforeEach, describe, expect, it, vi } from "vitest";

import { civilDate, getDefaultCampaignDeadlines } from "~/modules/domain";

const limitMock = vi.fn();
const dbMock = {
	select: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({ limit: limitMock }),
		}),
	}),
};

vi.mock("..", () => ({
	db: dbMock,
}));

async function loadGetCampaignDeadlines() {
	vi.resetModules();
	const { getCampaignDeadlines } = await import("../getCampaignDeadlines");
	return getCampaignDeadlines;
}

describe("getCampaignDeadlines", () => {
	beforeEach(() => {
		limitMock.mockReset();
	});

	it("falls back to the default deadlines when no row exists", async () => {
		limitMock.mockResolvedValueOnce([]);
		const getCampaignDeadlines = await loadGetCampaignDeadlines();

		const deadlines = await getCampaignDeadlines(2027);

		expect(deadlines.decl1ModificationDeadline).toEqual(civilDate(2027, 5, 1));
		expect(deadlines.gipPublicationDate).toBeNull();
		expect(deadlines.campaignStartDate).toBeNull();
	});

	it("matches the domain defaults exactly when no row exists", async () => {
		limitMock.mockResolvedValueOnce([]);
		const getCampaignDeadlines = await loadGetCampaignDeadlines();

		expect(await getCampaignDeadlines(2028)).toEqual(
			getDefaultCampaignDeadlines(2028),
		);
	});

	it("gives precedence to the dates configured in database", async () => {
		limitMock.mockResolvedValueOnce([
			{
				year: 2027,
				gipPublicationDate: "2027-03-01",
				campaignStartDate: "2027-03-05",
				decl1ModificationDeadline: "2027-07-01",
				decl1JustificationDeadline: "2028-03-01",
				decl1JointEvaluationDeadline: "2027-09-01",
				decl2ModificationDeadline: "2027-12-15",
				decl2JustificationDeadline: "2027-12-15",
				decl2JointEvaluationDeadline: "2028-01-15",
				decl2CseOpinionDeadline: "2028-02-15",
			},
		]);
		const getCampaignDeadlines = await loadGetCampaignDeadlines();

		const deadlines = await getCampaignDeadlines(2027);

		expect(deadlines.decl1ModificationDeadline).toEqual(civilDate(2027, 6, 1));
		expect(deadlines.campaignStartDate).toEqual(civilDate(2027, 2, 5));
	});
});
