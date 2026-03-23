import type { CompanySize } from "../types";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
} from "./constants";

/** Classify a company by workforce size into its declaration obligation tier. */
export function classifyCompanySize(workforce: number): CompanySize {
	if (workforce < COMPANY_SIZE_VOLUNTARY_MAX) return "voluntary";
	if (workforce < COMPANY_SIZE_ANNUAL_MIN) return "triennial";
	return "annual";
}

/** Returns true if the company is large enough to require CSE opinions (>= 100 employees). */
export function isCseRequired(workforce: number): boolean {
	return workforce >= COMPANY_SIZE_ANNUAL_MIN;
}
