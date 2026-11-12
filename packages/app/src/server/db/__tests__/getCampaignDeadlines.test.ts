import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	civilDate,
	getDefaultCampaignDeadlines,
	getPathChoiceDeadline,
	getPathChoiceRound1Deadline,
} from "~/modules/domain";

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

const STORED_ROW_2027 = {
	year: 2027,
	gipPublicationDate: null,
	campaignStartDate: null,
	publicDataReleaseDate: null,
	decl1ModificationDeadline: "2027-07-01",
	decl1JustificationDeadline: "2028-03-01",
	decl1JointEvaluationDeadline: "2027-09-01",
	decl2ModificationDeadline: "2027-12-15",
	decl2JustificationDeadline: "2027-12-15",
	decl2JointEvaluationDeadline: "2028-01-15",
	decl2CseOpinionDeadline: "2028-02-15",
	pathChoiceRound1Deadline: null,
	pathChoiceDeadline: null,
};

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
				pathChoiceRound1Deadline: null,
				pathChoiceDeadline: null,
			},
		]);
		const getCampaignDeadlines = await loadGetCampaignDeadlines();

		const deadlines = await getCampaignDeadlines(2027);

		expect(deadlines.decl1ModificationDeadline).toEqual(civilDate(2027, 6, 1));
		expect(deadlines.campaignStartDate).toEqual(civilDate(2027, 2, 5));
	});

	it("falls back to the computed path choice deadlines when the year leaves them unset (#4711)", async () => {
		limitMock.mockResolvedValueOnce([STORED_ROW_2027]);
		const getCampaignDeadlines = await loadGetCampaignDeadlines();

		const deadlines = await getCampaignDeadlines(2027);

		expect(deadlines.pathChoiceRound1Deadline).toEqual(
			getPathChoiceRound1Deadline(2027),
		);
		expect(deadlines.pathChoiceDeadline).toEqual(getPathChoiceDeadline(2027));
	});

	it("uses the path choice deadlines configured for the year (#4711)", async () => {
		limitMock.mockResolvedValueOnce([
			{
				...STORED_ROW_2027,
				pathChoiceRound1Deadline: "2027-07-15",
				pathChoiceDeadline: "2028-01-15",
			},
		]);
		const getCampaignDeadlines = await loadGetCampaignDeadlines();

		const deadlines = await getCampaignDeadlines(2027);

		expect(deadlines.pathChoiceRound1Deadline).toEqual(civilDate(2027, 6, 15));
		expect(deadlines.pathChoiceDeadline).toEqual(civilDate(2028, 0, 15));
	});
});
