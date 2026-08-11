import { classifyCompanySize } from "./companySize";
import { COMPANY_SIZE_VOLUNTARY_MAX } from "./constants";
import { formatCount } from "./submissionRate";

// Absent from the GIP file ⇒ deemed below the voluntary threshold, so banners display "< 50".
export const GIP_WORKFORCE_ABSENT_DISPLAY = `< ${COMPANY_SIZE_VOLUNTARY_MAX}`;

export function parseGipWorkforce(
	raw: string | number | null | undefined,
): number | null {
	if (raw === null || raw === undefined) return null;
	const value = typeof raw === "number" ? raw : Number.parseFloat(raw);
	return Number.isFinite(value) ? value : null;
}

// A company absent from the GIP file is not subject to the declaration, which every threshold rule expresses as a sub-50 headcount.
export function getObligationWorkforce(gipWorkforce: number | null): number {
	return gipWorkforce ?? 0;
}

/**
 * Headcount as it is shown to the user.
 *
 * A company of the voluntary tier is not identified by its exact headcount, so
 * every user-facing surface shows the bracket rather than the number — whether
 * the company is absent from the GIP file or present with a sub-threshold
 * figure. Only the two cases used to be told apart, and a company at 37 read
 * "37" (issue 3914).
 *
 * The tier is decided on the exact value, never on the floored one: 49,8
 * belongs to the voluntary tier and must not surface as "49". A headcount of
 * exactly 50 is outside the tier and keeps its number.
 */
export function formatWorkforceDisplay(gipWorkforce: number | null): string {
	if (
		gipWorkforce === null ||
		classifyCompanySize(gipWorkforce) === "voluntary"
	) {
		return GIP_WORKFORCE_ABSENT_DISPLAY;
	}

	return formatCount(Math.floor(gipWorkforce));
}
