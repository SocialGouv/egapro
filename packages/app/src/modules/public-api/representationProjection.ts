import { type companies, representationDeclarations } from "~/server/db/schema";
import { isCompanyDiffusible } from "./projection";
import type { PublicRepresentationDTO } from "./schemas";

export type PublicRepresentationSource = Pick<
	typeof representationDeclarations.$inferSelect,
	| "year"
	| "referencePeriodStart"
	| "referencePeriodEnd"
	| "executiveWomenPercent"
	| "executiveMenPercent"
	| "notComputableReasonExecutives"
	| "memberWomenPercent"
	| "memberMenPercent"
	| "notComputableReasonMembers"
	| "publishDate"
	| "publishUrl"
	| "publishModalities"
>;

export type PublicRepresentationCompanySource = Pick<
	typeof companies.$inferSelect,
	| "siren"
	| "name"
	| "address"
	| "region"
	| "departmentCode"
	| "departmentLabel"
	| "nafCode"
	| "nafLabel"
	| "statutDiffusion"
>;

/**
 * Drizzle column selection for the public representation indicators.
 * Spread into `.select({ ...publicRepresentationColumns, ...companyColumns })`
 * across every public-API query surface so the projected columns stay in
 * sync with {@link PublicRepresentationSource}.
 */
export const publicRepresentationColumns = {
	year: representationDeclarations.year,
	referencePeriodStart: representationDeclarations.referencePeriodStart,
	referencePeriodEnd: representationDeclarations.referencePeriodEnd,
	executiveWomenPercent: representationDeclarations.executiveWomenPercent,
	executiveMenPercent: representationDeclarations.executiveMenPercent,
	notComputableReasonExecutives:
		representationDeclarations.notComputableReasonExecutives,
	memberWomenPercent: representationDeclarations.memberWomenPercent,
	memberMenPercent: representationDeclarations.memberMenPercent,
	notComputableReasonMembers:
		representationDeclarations.notComputableReasonMembers,
	publishDate: representationDeclarations.publishDate,
	publishUrl: representationDeclarations.publishUrl,
	publishModalities: representationDeclarations.publishModalities,
} satisfies Record<keyof PublicRepresentationSource, unknown>;

function toNumber(value: string | null): number | null {
	if (value === null) return null;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? null : parsed;
}

export function toPublicRepresentation(
	declaration: PublicRepresentationSource,
	company: PublicRepresentationCompanySource,
): PublicRepresentationDTO {
	const diffusible = isCompanyDiffusible(company.statutDiffusion);

	return {
		siren: company.siren,
		year: declaration.year,
		name: diffusible ? company.name : null,
		address: diffusible ? company.address : null,
		region: diffusible ? company.region : null,
		departmentCode: diffusible ? company.departmentCode : null,
		departmentLabel: diffusible ? company.departmentLabel : null,
		nafCode: diffusible ? company.nafCode : null,
		nafLabel: diffusible ? company.nafLabel : null,
		referencePeriodStart: declaration.referencePeriodStart,
		referencePeriodEnd: declaration.referencePeriodEnd,
		executiveWomenPercent: toNumber(declaration.executiveWomenPercent),
		executiveMenPercent: toNumber(declaration.executiveMenPercent),
		notComputableReasonExecutives: declaration.notComputableReasonExecutives,
		memberWomenPercent: toNumber(declaration.memberWomenPercent),
		memberMenPercent: toNumber(declaration.memberMenPercent),
		notComputableReasonMembers: declaration.notComputableReasonMembers,
		publishDate: declaration.publishDate,
		publishUrl: declaration.publishUrl,
		publishModalities: declaration.publishModalities,
	};
}
