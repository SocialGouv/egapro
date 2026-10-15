import { alignCampaignYear } from "./campaignAlignment";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	V2_FIRST_CAMPAIGN_YEAR,
} from "./constants";

export function getObligationWorkforceMin(year: number): number {
	return alignCampaignYear(year) >= V2_FIRST_CAMPAIGN_YEAR
		? COMPANY_SIZE_VOLUNTARY_MAX
		: COMPANY_SIZE_ANNUAL_MIN;
}

export function isObligatedForYear(workforce: number, year: number): boolean {
	return workforce >= getObligationWorkforceMin(year);
}
