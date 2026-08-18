import { V2_FIRST_CAMPAIGN_YEAR } from "./constants";

// Temporary: 2026 maps to the first V2 campaign year (2027) so manual testing follows the test book — delete when 2027 arrives.
export const CAMPAIGN_YEAR_ALIGNED_ON_V2 = 2026;

export function alignCampaignYear(year: number): number {
	return year === CAMPAIGN_YEAR_ALIGNED_ON_V2 ? V2_FIRST_CAMPAIGN_YEAR : year;
}
