import { classifyCompanySize } from "./companySize";
import { COMPANY_SIZE_VOLUNTARY_MAX } from "./constants";
import { formatCount } from "./submissionRate";

// The one label every user-facing surface shows for the voluntary tier, whether
// the company is absent from the GIP file or present with a sub-threshold
// headcount. Named after the tier, not after the absence: both cases land here.
export const GIP_WORKFORCE_VOLUNTARY_DISPLAY = `< ${COMPANY_SIZE_VOLUNTARY_MAX}`;

export function parseGipWorkforce(
	raw: string | number | null | undefined,
): number | null {
	if (raw === null || raw === undefined) return null;
	const value = typeof raw === "number" ? raw : Number.parseFloat(raw);
	return Number.isFinite(value) ? value : null;
}

// A company absent from the GIP file is not subject to the declaration, which every
// threshold rule expresses as a headcount inside the voluntary tier.
export function getObligationWorkforce(gipWorkforce: number | null): number {
	return gipWorkforce ?? 0;
}

/**
 * Headcount as it is READ BY A HUMAN — user-facing screens and the PDFs they
 * download. Returns a localized string, possibly a bracket instead of a figure.
 *
 * A company of the voluntary tier is not identified by its exact headcount, so
 * every user-facing surface shows the bracket rather than the number — whether
 * the company is absent from the GIP file or present with a sub-threshold
 * figure. Only the two cases used to be told apart, and a company at 37 read
 * "37" (issue 3914).
 *
 * The tier is decided on the exact value, never on the floored one: a headcount
 * just under the threshold belongs to the voluntary tier and must not surface
 * rounded down to a figure. A headcount exactly at the threshold is outside the
 * tier and keeps its number.
 *
 * Never use for a machine consumer — see `toDisplayWorkforce`.
 */
export function formatWorkforceDisplay(gipWorkforce: number | null): string {
	if (
		gipWorkforce === null ||
		classifyCompanySize(gipWorkforce) === "voluntary"
	) {
		return GIP_WORKFORCE_VOLUNTARY_DISPLAY;
	}

	return formatCount(Math.floor(gipWorkforce));
}

/**
 * Headcount as it is READ BY A MACHINE — the public open-data API, the SUIT
 * export and the back-office screens. Returns the number itself, never a
 * bracket.
 *
 * Deliberate counterpart of `formatWorkforceDisplay`: these consumers have a
 * typed contract on a numeric headcount, and the back-office needs the exact
 * figure to support the company. Bracketing them would break the contract
 * without versioning it and blind the administrators.
 *
 * Floored so 99,97 never reads as "100" — thresholds compare the exact value.
 */
export function toDisplayWorkforce(gipWorkforce: number | null): number | null {
	return gipWorkforce === null ? null : Math.floor(gipWorkforce);
}
