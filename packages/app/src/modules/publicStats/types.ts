export type CurrentCampaignRate = {
	totalObligated: number;
	totalSubmitted: number;
	submissionRate: number;
	previousYearRate: number | null;
	year: number;
};
