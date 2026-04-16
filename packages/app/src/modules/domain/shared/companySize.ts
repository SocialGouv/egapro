import { z } from "zod";
import type { CompanySize, CompanySizeRange } from "../types";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	TRIENNIAL_ANCHOR_YEAR,
	TRIENNIAL_CYCLE,
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
 * Returns true if a company of the given workforce is legally required to
 * declare for the given campaign year.
 *
 * - `< 50` employees: never obligated (voluntary declaration).
 * - `50-99` employees: triennial cycle — obligated only in anchor years.
 * - `>= 100` employees: obligated every year.
 */
export function isObligatedForYear(workforce: number, year: number): boolean {
	if (workforce < COMPANY_SIZE_VOLUNTARY_MAX) return false;
	if (workforce >= COMPANY_SIZE_ANNUAL_MIN) return true;
	return (
		year >= TRIENNIAL_ANCHOR_YEAR &&
		(year - TRIENNIAL_ANCHOR_YEAR) % TRIENNIAL_CYCLE === 0
	);
}

/**
 * Workforce range presets shared by all admin/public KPI filters.
 *
 * `max: null` means unbounded (`250+`). Bounds are inclusive on both sides.
 * Boundaries (50, 100, 150, 250) mirror the legal thresholds used by the
 * obligation rules (`isObligatedForYear`, `isCseRequired`).
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

/** Zod validator for a `CompanySizeRange` value. */
export const companySizeRangeSchema = z.enum([
	"<50",
	"50-99",
	"100-149",
	"150-249",
	"250+",
]);
