import type { CompanySize, CompanySizeRange } from "../types";
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

/**
 * Workforce range buckets shared by admin and public statistics filters.
 * `max: null` means the bucket is open-ended (no upper bound).
 * Insertion order matches the expected UI order.
 */
export const COMPANY_SIZE_RANGES: Record<
	CompanySizeRange,
	{ min: number; max: number | null; label: string }
> = {
	"<50": { min: 0, max: 49, label: "Moins de 50 salariés" },
	"50-99": { min: 50, max: 99, label: "50 à 99 salariés" },
	"100-149": { min: 100, max: 149, label: "100 à 149 salariés" },
	"150-249": { min: 150, max: 249, label: "150 à 249 salariés" },
	"250+": { min: 250, max: null, label: "250 salariés et plus" },
};
