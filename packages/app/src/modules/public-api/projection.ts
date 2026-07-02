import type { companies, declarations } from "~/server/db/schema";
import type { PublicDeclarationDTO } from "./schemas";

export type PublicDeclarationSource = Pick<
	typeof declarations.$inferSelect,
	| "year"
	| "totalWomen"
	| "totalMen"
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
> & {
	statutDiffusion: string | null;
	workforceEma: string | null;
};

export function isCompanyDiffusible(statutDiffusion: string | null): boolean {
	return statutDiffusion !== "N";
}

function toNumber(value: string | null): number | null {
	if (value === null) return null;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? null : parsed;
}

export function toPublicDeclaration(
	declaration: PublicDeclarationSource,
	company: PublicCompanySource,
): PublicDeclarationDTO {
	const diffusible = isCompanyDiffusible(company.statutDiffusion);

	return {
		year: declaration.year,
		siren: company.siren,
		name: diffusible ? company.name : null,
		address: diffusible ? company.address : null,
		region: diffusible ? company.region : null,
		departmentCode: diffusible ? company.departmentCode : null,
		departmentLabel: diffusible ? company.departmentLabel : null,
		nafCode: diffusible ? company.nafCode : null,
		nafLabel: diffusible ? company.nafLabel : null,
		workforceEma: toNumber(company.workforceEma),
		totalWomen: declaration.totalWomen,
		totalMen: declaration.totalMen,
		globalAnnualMeanGap: toNumber(declaration.globalAnnualMeanGap),
		globalAnnualMedianGap: toNumber(declaration.globalAnnualMedianGap),
		globalHourlyMeanGap: toNumber(declaration.globalHourlyMeanGap),
		globalHourlyMedianGap: toNumber(declaration.globalHourlyMedianGap),
		variableAnnualMeanGap: toNumber(declaration.variableAnnualMeanGap),
		variableAnnualMedianGap: toNumber(declaration.variableAnnualMedianGap),
		variableHourlyMeanGap: toNumber(declaration.variableHourlyMeanGap),
		variableHourlyMedianGap: toNumber(declaration.variableHourlyMedianGap),
		variableProportionWomen: toNumber(declaration.variableProportionWomen),
		variableProportionMen: toNumber(declaration.variableProportionMen),
		annualQuartile1ProportionWomen: toNumber(
			declaration.annualQuartile1ProportionWomen,
		),
		annualQuartile2ProportionWomen: toNumber(
			declaration.annualQuartile2ProportionWomen,
		),
		annualQuartile3ProportionWomen: toNumber(
			declaration.annualQuartile3ProportionWomen,
		),
		annualQuartile4ProportionWomen: toNumber(
			declaration.annualQuartile4ProportionWomen,
		),
		annualQuartile1ProportionMen: toNumber(
			declaration.annualQuartile1ProportionMen,
		),
		annualQuartile2ProportionMen: toNumber(
			declaration.annualQuartile2ProportionMen,
		),
		annualQuartile3ProportionMen: toNumber(
			declaration.annualQuartile3ProportionMen,
		),
		annualQuartile4ProportionMen: toNumber(
			declaration.annualQuartile4ProportionMen,
		),
		hourlyQuartile1ProportionWomen: toNumber(
			declaration.hourlyQuartile1ProportionWomen,
		),
		hourlyQuartile2ProportionWomen: toNumber(
			declaration.hourlyQuartile2ProportionWomen,
		),
		hourlyQuartile3ProportionWomen: toNumber(
			declaration.hourlyQuartile3ProportionWomen,
		),
		hourlyQuartile4ProportionWomen: toNumber(
			declaration.hourlyQuartile4ProportionWomen,
		),
		hourlyQuartile1ProportionMen: toNumber(
			declaration.hourlyQuartile1ProportionMen,
		),
		hourlyQuartile2ProportionMen: toNumber(
			declaration.hourlyQuartile2ProportionMen,
		),
		hourlyQuartile3ProportionMen: toNumber(
			declaration.hourlyQuartile3ProportionMen,
		),
		hourlyQuartile4ProportionMen: toNumber(
			declaration.hourlyQuartile4ProportionMen,
		),
	};
}
