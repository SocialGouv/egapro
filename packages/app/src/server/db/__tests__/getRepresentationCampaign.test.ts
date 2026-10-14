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

		expect(campaign.campaignStartDate).toEqual(
			new Date("2027-01-01T00:00:00Z"),
		);
		expect(campaign.campaignEndDate).toEqual(new Date("2027-12-31T00:00:00Z"));
		expect(campaign.declarationDeadline).toEqual(
			new Date("2027-06-01T00:00:00Z"),
		);
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

		expect(campaign.campaignStartDate).toEqual(
			new Date("2027-02-15T00:00:00Z"),
		);
		expect(campaign.campaignEndDate).toEqual(new Date("2027-09-30T00:00:00Z"));
		expect(campaign.declarationDeadline).toEqual(
			new Date("2027-04-01T00:00:00Z"),
		);
	});

	it("parses stored dates at UTC midnight of their civil day", async () => {
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

		expect(campaign.campaignStartDate.toISOString()).toBe(
			"2027-01-01T00:00:00.000Z",
		);
		expect(campaign.campaignEndDate.toISOString()).toBe(
			"2027-12-31T00:00:00.000Z",
		);
	});
});
