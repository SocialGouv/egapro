import { type companies, representationDeclarations } from "~/server/db/schema";
import { NON_DIFFUSIBLE_LABEL } from "./constants";
import { isPublicCompanyDiffusible, toNumber } from "./projection";
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

export function toPublicRepresentation(
	declaration: PublicRepresentationSource,
	company: PublicRepresentationCompanySource,
): PublicRepresentationDTO {
	const diffusible = isPublicCompanyDiffusible(
		company.statutDiffusion,
		company.address,
	);

	return {
		siren: company.siren,
		year: declaration.year,
		name: diffusible ? company.name : NON_DIFFUSIBLE_LABEL,
		address: diffusible ? company.address : NON_DIFFUSIBLE_LABEL,
		region: diffusible ? company.region : NON_DIFFUSIBLE_LABEL,
		departmentCode: diffusible ? company.departmentCode : NON_DIFFUSIBLE_LABEL,
		departmentLabel: diffusible
			? company.departmentLabel
			: NON_DIFFUSIBLE_LABEL,
		nafCode: diffusible ? company.nafCode : NON_DIFFUSIBLE_LABEL,
		nafLabel: diffusible ? company.nafLabel : NON_DIFFUSIBLE_LABEL,
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
