import { alignCampaignYear } from "./campaignAlignment";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	V2_FIRST_CAMPAIGN_YEAR,
} from "./constants";

export function isObligatedForYear(workforce: number, year: number): boolean {
	if (workforce < COMPANY_SIZE_VOLUNTARY_MAX) return false;
	// 50-99: annual obligation since the V2 scheme (2026-07 arbitrage). Pre-V2 years keep the historical behavior.
	if (workforce < COMPANY_SIZE_ANNUAL_MIN)
		return alignCampaignYear(year) >= V2_FIRST_CAMPAIGN_YEAR;
	return true;
}
