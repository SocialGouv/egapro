import {
	ADDRESS_ROW_LABEL,
	type CompanyLocationRow,
	companyLocationRow,
	percentageOf,
} from "~/modules/domain";
import { NON_DIFFUSIBLE_LABEL } from "~/modules/public-api/constants";

/** Share of `part` in `total`, on a 0-100 scale, or null when undecidable. */
export function shareOf(
	part: number | null,
	total: number | null,
): number | null {
	if (part === null || total === null || total === 0) return null;
	return percentageOf(part, total);
}

type SearchLocationInput = {
	countryCode: string | null;
	countryLabel: string | null;
	departmentLabel: string | null;
	region: string | null;
};

const NON_DIFFUSIBLE_ROW: CompanyLocationRow = {
	label: ADDRESS_ROW_LABEL,
	value: NON_DIFFUSIBLE_LABEL,
};

function isMasked(...values: (string | null)[]): boolean {
	return values.includes(NON_DIFFUSIBLE_LABEL);
}

function departmentAndRegion(company: SearchLocationInput): string {
	return [company.departmentLabel, company.region].filter(Boolean).join(", ");
}

export function companyLocation(
	company: SearchLocationInput,
): CompanyLocationRow | null {
	if (isMasked(company.countryLabel, company.departmentLabel, company.region)) {
		return NON_DIFFUSIBLE_ROW;
	}
	return companyLocationRow({
		countryCode: company.countryCode,
		countryLabel: company.countryLabel,
		departmentLabel: company.departmentLabel,
		domesticAddress: departmentAndRegion(company),
	});
}

export function companyPageLocation(
	company: SearchLocationInput & { address: string | null },
): CompanyLocationRow | null {
	if (
		isMasked(
			company.address,
			company.countryLabel,
			company.departmentLabel,
			company.region,
		)
	) {
		return NON_DIFFUSIBLE_ROW;
	}
	return companyLocationRow({
		countryCode: company.countryCode,
		countryLabel: company.countryLabel,
		departmentLabel: company.departmentLabel,
		domesticAddress: company.address || departmentAndRegion(company),
	});
}

export function formatNaf(
	code: string | null,
	label: string | null,
): string | null {
	if (code === NON_DIFFUSIBLE_LABEL || label === NON_DIFFUSIBLE_LABEL) {
		return NON_DIFFUSIBLE_LABEL;
	}
	if (label) return `${label}${code ? ` (${code})` : ""}`;
	return code;
}

export type GapDirection = {
	/** Sentence up to the emphasised word, e.g. "Écart en faveur des ". */
	prefix: string;
	/** The emphasised word, e.g. "hommes"; empty when there is nothing to stress. */
	emphasis: string;
};

/**
 * A positive gap means men are paid more — the sign convention of every
 * `*Gap` column. Rendered as "Écart en faveur des **hommes**".
 */
export function gapDirection(ratio: number | null): GapDirection {
	if (ratio === null) return { prefix: "Donnée non disponible", emphasis: "" };
	if (ratio > 0) return { prefix: "Écart en faveur des ", emphasis: "hommes" };
	if (ratio < 0) return { prefix: "Écart en faveur des ", emphasis: "femmes" };
	return { prefix: "Aucun écart constaté", emphasis: "" };
}
