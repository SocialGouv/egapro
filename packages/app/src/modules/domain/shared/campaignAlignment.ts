import { V2_FIRST_CAMPAIGN_YEAR } from "./constants";

// Temporary: 2026 maps to the first V2 campaign year (2027) so manual testing follows the test book — delete when 2027 arrives.
export const CAMPAIGN_YEAR_ALIGNED_ON_V2 = 2026;

// Normalizes a campaign year onto the V2 ruleset: the bridged 2026 campaign resolves to
// V2_FIRST_CAMPAIGN_YEAR, every other year is returned unchanged.
export function alignCampaignYear(year: number): number {
	return year === CAMPAIGN_YEAR_ALIGNED_ON_V2 ? V2_FIRST_CAMPAIGN_YEAR : year;
}
