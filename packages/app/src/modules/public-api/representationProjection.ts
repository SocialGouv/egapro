import { toNullableNumber } from "~/modules/domain";
import { type companies, representationDeclarations } from "~/server/db/schema";
import { NON_DIFFUSIBLE_LABEL } from "./constants";
import { isPublicCompanyDiffusible } from "./projection";
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

type RepresentationIdentity = {
	name: string | null;
	address?: string | null;
	region: string | null;
	departmentCode: string | null;
	departmentLabel: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	publishUrl: string | null;
	publishModalities: string | null;
};

const NON_DIFFUSIBLE_IDENTITY = {
	name: NON_DIFFUSIBLE_LABEL,
	region: NON_DIFFUSIBLE_LABEL,
	departmentCode: NON_DIFFUSIBLE_LABEL,
	departmentLabel: NON_DIFFUSIBLE_LABEL,
	nafCode: NON_DIFFUSIBLE_LABEL,
	nafLabel: NON_DIFFUSIBLE_LABEL,
	publishUrl: null,
	publishModalities: null,
} satisfies Omit<Required<RepresentationIdentity>, "address">;

export function maskNonDiffusibleRepresentation<
	T extends RepresentationIdentity,
>(representation: T, diffusible: boolean): T {
	if (diffusible) return representation;
	return {
		...representation,
		...NON_DIFFUSIBLE_IDENTITY,
		// The public export has no address column: masking must not add one.
		...("address" in representation && { address: NON_DIFFUSIBLE_LABEL }),
	};
}

export function toPublicRepresentation(
	declaration: PublicRepresentationSource,
	company: PublicRepresentationCompanySource,
): PublicRepresentationDTO {
	return maskNonDiffusibleRepresentation(
		{
			siren: company.siren,
			year: declaration.year,
			name: company.name,
			address: company.address,
			region: company.region,
			departmentCode: company.departmentCode,
			departmentLabel: company.departmentLabel,
			nafCode: company.nafCode,
			nafLabel: company.nafLabel,
			referencePeriodStart: declaration.referencePeriodStart,
			referencePeriodEnd: declaration.referencePeriodEnd,
			executiveWomenPercent: toNullableNumber(
				declaration.executiveWomenPercent,
			),
			executiveMenPercent: toNullableNumber(declaration.executiveMenPercent),
			notComputableReasonExecutives: declaration.notComputableReasonExecutives,
			memberWomenPercent: toNullableNumber(declaration.memberWomenPercent),
			memberMenPercent: toNullableNumber(declaration.memberMenPercent),
			notComputableReasonMembers: declaration.notComputableReasonMembers,
			publishDate: declaration.publishDate,
			publishUrl: declaration.publishUrl,
			publishModalities: declaration.publishModalities,
		},
		isPublicCompanyDiffusible(company.statutDiffusion, company.address),
	);
}
