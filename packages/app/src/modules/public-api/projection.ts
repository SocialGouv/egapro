import { toNullableNumber } from "~/modules/domain";
import { type companies, declarations } from "~/server/db/schema";
import { NON_DIFFUSIBLE_LABEL } from "./constants";
import type { PublicDeclarationDTO } from "./schemas";

export type PublicDeclarationSource = Pick<
	typeof declarations.$inferSelect,
	| "year"
	| "totalWomen"
	| "totalMen"
	| "hourlyWomen"
	| "hourlyMen"
	| "globalAnnualMeanGap"
	| "globalAnnualMedianGap"
	| "globalHourlyMeanGap"
	| "globalHourlyMedianGap"
	| "variableAnnualMeanGap"
	| "variableAnnualMedianGap"
	| "variableHourlyMeanGap"
	| "variableHourlyMedianGap"
	| "variableProportionWomen"
	| "variableProportionMen"
	| "annualQuartile1ProportionWomen"
	| "annualQuartile2ProportionWomen"
	| "annualQuartile3ProportionWomen"
	| "annualQuartile4ProportionWomen"
	| "annualQuartile1ProportionMen"
	| "annualQuartile2ProportionMen"
	| "annualQuartile3ProportionMen"
	| "annualQuartile4ProportionMen"
	| "hourlyQuartile1ProportionWomen"
	| "hourlyQuartile2ProportionWomen"
	| "hourlyQuartile3ProportionWomen"
	| "hourlyQuartile4ProportionWomen"
	| "hourlyQuartile1ProportionMen"
	| "hourlyQuartile2ProportionMen"
	| "hourlyQuartile3ProportionMen"
	| "hourlyQuartile4ProportionMen"
>;

export type PublicCompanySource = Pick<
	typeof companies.$inferSelect,
	| "siren"
	| "name"
	| "address"
	| "region"
	| "departmentCode"
	| "departmentLabel"
	| "nafCode"
	| "nafLabel"
> &
	Partial<
		Pick<
			typeof companies.$inferSelect,
			"city" | "regionCode" | "countryCode" | "countryLabel"
		>
	> & {
		statutDiffusion: string | null;
		workforceEma: string | null;
	};

/**
 * Drizzle column selection for the public declaration indicators.
 * Spread into `.select({ ...publicDeclarationColumns, ...companyColumns })`
 * across every public-API query surface so the projected indicator columns
 * stay in sync with {@link PublicDeclarationSource}. The resulting query row
 * is directly assignable to {@link PublicDeclarationSource} and can be passed
 * as-is to {@link toPublicDeclaration}.
 */
export const publicDeclarationColumns = {
	year: declarations.year,
	totalWomen: declarations.totalWomen,
	totalMen: declarations.totalMen,
	hourlyWomen: declarations.hourlyWomen,
	hourlyMen: declarations.hourlyMen,
	globalAnnualMeanGap: declarations.globalAnnualMeanGap,
	globalAnnualMedianGap: declarations.globalAnnualMedianGap,
	globalHourlyMeanGap: declarations.globalHourlyMeanGap,
	globalHourlyMedianGap: declarations.globalHourlyMedianGap,
	variableAnnualMeanGap: declarations.variableAnnualMeanGap,
	variableAnnualMedianGap: declarations.variableAnnualMedianGap,
	variableHourlyMeanGap: declarations.variableHourlyMeanGap,
	variableHourlyMedianGap: declarations.variableHourlyMedianGap,
	variableProportionWomen: declarations.variableProportionWomen,
	variableProportionMen: declarations.variableProportionMen,
	annualQuartile1ProportionWomen: declarations.annualQuartile1ProportionWomen,
	annualQuartile2ProportionWomen: declarations.annualQuartile2ProportionWomen,
	annualQuartile3ProportionWomen: declarations.annualQuartile3ProportionWomen,
	annualQuartile4ProportionWomen: declarations.annualQuartile4ProportionWomen,
	annualQuartile1ProportionMen: declarations.annualQuartile1ProportionMen,
	annualQuartile2ProportionMen: declarations.annualQuartile2ProportionMen,
	annualQuartile3ProportionMen: declarations.annualQuartile3ProportionMen,
	annualQuartile4ProportionMen: declarations.annualQuartile4ProportionMen,
	hourlyQuartile1ProportionWomen: declarations.hourlyQuartile1ProportionWomen,
	hourlyQuartile2ProportionWomen: declarations.hourlyQuartile2ProportionWomen,
	hourlyQuartile3ProportionWomen: declarations.hourlyQuartile3ProportionWomen,
	hourlyQuartile4ProportionWomen: declarations.hourlyQuartile4ProportionWomen,
	hourlyQuartile1ProportionMen: declarations.hourlyQuartile1ProportionMen,
	hourlyQuartile2ProportionMen: declarations.hourlyQuartile2ProportionMen,
	hourlyQuartile3ProportionMen: declarations.hourlyQuartile3ProportionMen,
	hourlyQuartile4ProportionMen: declarations.hourlyQuartile4ProportionMen,
} satisfies Record<keyof PublicDeclarationSource, unknown>;

export function isCompanyDiffusible(statutDiffusion: string | null): boolean {
	return statutDiffusion !== "N";
}

export function isPublicCompanyDiffusible(
	statutDiffusion: string | null,
	address: string | null,
): boolean {
	return statutDiffusion === null
		? address !== null
		: isCompanyDiffusible(statutDiffusion);
}

function publicCompanyValue(
	value: string | null | undefined,
	diffusible: boolean,
): string | null {
	return diffusible ? (value ?? null) : NON_DIFFUSIBLE_LABEL;
}

export type PublicCompanyLocation = {
	address: string | null;
	city: string | null;
	regionCode: string | null;
	region: string | null;
	departmentCode: string | null;
	departmentLabel: string | null;
	countryCode: string | null;
	countryLabel: string | null;
};

export type PublicCompanyLocationSource = {
	[Key in keyof PublicCompanyLocation]?: string | null;
} & { statutDiffusion: string | null };

export function toPublicCompanyLocation(
	company: PublicCompanyLocationSource,
): PublicCompanyLocation {
	const diffusible = isPublicCompanyDiffusible(
		company.statutDiffusion,
		company.address ?? null,
	);
	return {
		address: publicCompanyValue(company.address, diffusible),
		city: publicCompanyValue(company.city, diffusible),
		regionCode: publicCompanyValue(company.regionCode, diffusible),
		region: publicCompanyValue(
			company.countryCode ? null : company.region,
			diffusible,
		),
		departmentCode: publicCompanyValue(company.departmentCode, diffusible),
		departmentLabel: publicCompanyValue(company.departmentLabel, diffusible),
		countryCode: publicCompanyValue(company.countryCode, diffusible),
		countryLabel: publicCompanyValue(company.countryLabel, diffusible),
	};
}

export function toPublicDeclaration(
	declaration: PublicDeclarationSource,
	company: PublicCompanySource,
): PublicDeclarationDTO {
	const diffusible = isPublicCompanyDiffusible(
		company.statutDiffusion,
		company.address,
	);

	return {
		year: declaration.year,
		siren: company.siren,
		name: publicCompanyValue(company.name, diffusible),
		...toPublicCompanyLocation(company),
		nafCode: publicCompanyValue(company.nafCode, diffusible),
		nafLabel: publicCompanyValue(company.nafLabel, diffusible),
		workforceEma: toNullableNumber(company.workforceEma),
		totalWomen: declaration.totalWomen,
		totalMen: declaration.totalMen,
		hourlyWomen: declaration.hourlyWomen,
		hourlyMen: declaration.hourlyMen,
		globalAnnualMeanGap: toNullableNumber(declaration.globalAnnualMeanGap),
		globalAnnualMedianGap: toNullableNumber(declaration.globalAnnualMedianGap),
		globalHourlyMeanGap: toNullableNumber(declaration.globalHourlyMeanGap),
		globalHourlyMedianGap: toNullableNumber(declaration.globalHourlyMedianGap),
		variableAnnualMeanGap: toNullableNumber(declaration.variableAnnualMeanGap),
		variableAnnualMedianGap: toNullableNumber(
			declaration.variableAnnualMedianGap,
		),
		variableHourlyMeanGap: toNullableNumber(declaration.variableHourlyMeanGap),
		variableHourlyMedianGap: toNullableNumber(
			declaration.variableHourlyMedianGap,
		),
		variableProportionWomen: toNullableNumber(
			declaration.variableProportionWomen,
		),
		variableProportionMen: toNullableNumber(declaration.variableProportionMen),
		annualQuartile1ProportionWomen: toNullableNumber(
			declaration.annualQuartile1ProportionWomen,
		),
		annualQuartile2ProportionWomen: toNullableNumber(
			declaration.annualQuartile2ProportionWomen,
		),
		annualQuartile3ProportionWomen: toNullableNumber(
			declaration.annualQuartile3ProportionWomen,
		),
		annualQuartile4ProportionWomen: toNullableNumber(
			declaration.annualQuartile4ProportionWomen,
		),
		annualQuartile1ProportionMen: toNullableNumber(
			declaration.annualQuartile1ProportionMen,
		),
		annualQuartile2ProportionMen: toNullableNumber(
			declaration.annualQuartile2ProportionMen,
		),
		annualQuartile3ProportionMen: toNullableNumber(
			declaration.annualQuartile3ProportionMen,
		),
		annualQuartile4ProportionMen: toNullableNumber(
			declaration.annualQuartile4ProportionMen,
		),
		hourlyQuartile1ProportionWomen: toNullableNumber(
			declaration.hourlyQuartile1ProportionWomen,
		),
		hourlyQuartile2ProportionWomen: toNullableNumber(
			declaration.hourlyQuartile2ProportionWomen,
		),
		hourlyQuartile3ProportionWomen: toNullableNumber(
			declaration.hourlyQuartile3ProportionWomen,
		),
		hourlyQuartile4ProportionWomen: toNullableNumber(
			declaration.hourlyQuartile4ProportionWomen,
		),
		hourlyQuartile1ProportionMen: toNullableNumber(
			declaration.hourlyQuartile1ProportionMen,
		),
		hourlyQuartile2ProportionMen: toNullableNumber(
			declaration.hourlyQuartile2ProportionMen,
		),
		hourlyQuartile3ProportionMen: toNullableNumber(
			declaration.hourlyQuartile3ProportionMen,
		),
		hourlyQuartile4ProportionMen: toNullableNumber(
			declaration.hourlyQuartile4ProportionMen,
		),
	};
}
