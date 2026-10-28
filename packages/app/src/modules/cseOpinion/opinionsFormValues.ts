import type { UseFormSetValue } from "react-hook-form";
import type { z } from "zod";

import type { saveOpinionsSchema } from "./schemas";
import type { CseOpinionStep1Data, OpinionType } from "./types";

export const CLEARED_GAP_FIELDS = {
	gapOpinion: null,
	gapDate: null,
} as const;

type OpinionsInput = z.infer<typeof saveOpinionsSchema>;
type DeclarationOpinionInput = OpinionsInput["firstDeclaration"];

export type JustificationRequirements = {
	firstDeclJustificationRequired: boolean;
	secondDeclJustificationRequired: boolean;
};

export function buildOpinionsFormValues(
	initialData: CseOpinionStep1Data | undefined,
	hasSecondDeclaration: boolean,
	{
		firstDeclJustificationRequired,
		secondDeclJustificationRequired,
	}: JustificationRequirements,
) {
	return {
		firstDeclaration: {
			accuracyOpinion: initialData?.firstDeclAccuracyOpinion ?? undefined,
			accuracyDate: initialData?.firstDeclAccuracyDate ?? "",
			...(firstDeclJustificationRequired
				? {
						gapOpinion: initialData?.firstDeclGapOpinion ?? null,
						gapDate: initialData?.firstDeclGapDate ?? null,
					}
				: CLEARED_GAP_FIELDS),
		},
		secondDeclaration: hasSecondDeclaration
			? {
					accuracyOpinion: initialData?.secondDeclAccuracyOpinion ?? undefined,
					accuracyDate: initialData?.secondDeclAccuracyDate ?? "",
					...(secondDeclJustificationRequired
						? {
								gapOpinion: initialData?.secondDeclGapOpinion ?? null,
								gapDate: initialData?.secondDeclGapDate ?? null,
							}
						: CLEARED_GAP_FIELDS),
				}
			: undefined,
	};
}

function clearUnrequiredJustification<T extends DeclarationOpinionInput>(
	declaration: T,
	required: boolean,
): T {
	return required ? declaration : { ...declaration, ...CLEARED_GAP_FIELDS };
}

export function normalizeSubmittedOpinions(
	data: OpinionsInput,
	{
		firstDeclJustificationRequired,
		secondDeclJustificationRequired,
	}: JustificationRequirements,
): OpinionsInput {
	return {
		firstDeclaration: clearUnrequiredJustification(
			data.firstDeclaration,
			firstDeclJustificationRequired,
		),
		secondDeclaration: data.secondDeclaration
			? clearUnrequiredJustification(
					data.secondDeclaration,
					secondDeclJustificationRequired,
				)
			: undefined,
	};
}

export function isJustificationOpinionIncomplete(
	declaration: DeclarationOpinionInput | undefined,
	required: boolean,
) {
	return required && (!declaration?.gapOpinion || !declaration.gapDate);
}

type DeclarationDraft = {
	accuracyOpinion?: OpinionType;
	accuracyDate?: string;
	gapOpinion?: OpinionType | null;
	gapDate?: string | null;
};

type OpinionsDraft = {
	firstDeclaration?: DeclarationDraft;
	secondDeclaration?: DeclarationDraft;
};

type SetOpinionsValue = UseFormSetValue<OpinionsInput>;

function applyDeclarationDraft(
	setValue: SetOpinionsValue,
	prefix: "firstDeclaration" | "secondDeclaration",
	draft: DeclarationDraft | undefined,
	justificationRequired: boolean,
) {
	if (!justificationRequired) {
		setValue(`${prefix}.gapOpinion`, CLEARED_GAP_FIELDS.gapOpinion);
		setValue(`${prefix}.gapDate`, CLEARED_GAP_FIELDS.gapDate);
	}
	if (!draft) return;
	if (draft.accuracyOpinion !== undefined)
		setValue(`${prefix}.accuracyOpinion`, draft.accuracyOpinion);
	if (draft.accuracyDate !== undefined)
		setValue(`${prefix}.accuracyDate`, draft.accuracyDate);
	if (justificationRequired && draft.gapOpinion !== undefined)
		setValue(`${prefix}.gapOpinion`, draft.gapOpinion);
	if (justificationRequired && draft.gapDate !== undefined)
		setValue(`${prefix}.gapDate`, draft.gapDate);
}

export function hydrateOpinionsForm(
	setValue: SetOpinionsValue,
	draft: OpinionsDraft,
	hasSecondDeclaration: boolean,
	{
		firstDeclJustificationRequired,
		secondDeclJustificationRequired,
	}: JustificationRequirements,
) {
	applyDeclarationDraft(
		setValue,
		"firstDeclaration",
		draft.firstDeclaration,
		firstDeclJustificationRequired,
	);
	if (!hasSecondDeclaration) return;
	applyDeclarationDraft(
		setValue,
		"secondDeclaration",
		draft.secondDeclaration,
		secondDeclJustificationRequired,
	);
}
