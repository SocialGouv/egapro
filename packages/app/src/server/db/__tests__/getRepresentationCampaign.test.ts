import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDefaultRepresentationCampaign } from "~/modules/domain";

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

async function loadGetRepresentationCampaign() {
	vi.resetModules();
	const { getRepresentationCampaign } = await import(
		"../getRepresentationCampaign"
	);
	return getRepresentationCampaign;
}

describe("getRepresentationCampaign", () => {
	beforeEach(() => {
		limitMock.mockReset();
	});

	it("falls back to the default campaign when no row exists", async () => {
		limitMock.mockResolvedValueOnce([]);
		const getRepresentationCampaign = await loadGetRepresentationCampaign();

		const campaign = await getRepresentationCampaign(2027);

		expect(campaign.campaignStartDate).toEqual(new Date(2027, 0, 1));
		expect(campaign.campaignEndDate).toEqual(new Date(2027, 11, 31));
		expect(campaign.declarationDeadline).toEqual(new Date(2027, 2, 1));
	});

	it("matches the domain defaults exactly when no row exists", async () => {
		limitMock.mockResolvedValueOnce([]);
		const getRepresentationCampaign = await loadGetRepresentationCampaign();

		expect(await getRepresentationCampaign(2028)).toEqual(
			getDefaultRepresentationCampaign(2028),
		);
	});

	it("gives precedence to the dates configured in database", async () => {
		limitMock.mockResolvedValueOnce([
			{
				year: 2027,
				campaignStartDate: "2027-02-15",
				campaignEndDate: "2027-09-30",
				declarationDeadline: "2027-04-01",
			},
		]);
		const getRepresentationCampaign = await loadGetRepresentationCampaign();

		const campaign = await getRepresentationCampaign(2027);

		expect(campaign.campaignStartDate).toEqual(new Date(2027, 1, 15));
		expect(campaign.campaignEndDate).toEqual(new Date(2027, 8, 30));
		expect(campaign.declarationDeadline).toEqual(new Date(2027, 3, 1));
	});

	it("parses stored dates at local midnight, not UTC", async () => {
		limitMock.mockResolvedValueOnce([
			{
				year: 2027,
				campaignStartDate: "2027-01-01",
				campaignEndDate: "2027-12-31",
				declarationDeadline: "2027-03-01",
			},
		]);
		const getRepresentationCampaign = await loadGetRepresentationCampaign();

		const campaign = await getRepresentationCampaign(2027);

		expect(campaign.campaignStartDate.getHours()).toBe(0);
		expect(campaign.campaignStartDate.getDate()).toBe(1);
		expect(campaign.campaignEndDate.getDate()).toBe(31);
	});
});
