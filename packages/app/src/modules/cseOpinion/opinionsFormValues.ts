import type { UseFormSetValue } from "react-hook-form";
import type { z } from "zod";

import type { saveOpinionsSchema } from "./schemas";
import type { CseOpinionStep1Data } from "./types";

export const CLEARED_GAP_FIELDS = {
	gapConsulted: false,
	gapOpinion: null,
	gapDate: null,
} as const;

type OpinionsInput = z.infer<typeof saveOpinionsSchema>;

export function buildOpinionsFormValues(
	initialData: CseOpinionStep1Data | undefined,
	hasSecondDeclaration: boolean,
	showSecondDeclarationGap: boolean,
	isSecondDeclarationJustification = false,
) {
	return {
		firstDeclaration: {
			accuracyOpinion: initialData?.firstDeclAccuracyOpinion ?? undefined,
			accuracyDate: initialData?.firstDeclAccuracyDate ?? "",
			gapConsulted: initialData?.firstDeclGapConsulted ?? undefined,
			gapOpinion: initialData?.firstDeclGapOpinion ?? null,
			gapDate: initialData?.firstDeclGapDate ?? null,
		},
		secondDeclaration: hasSecondDeclaration
			? {
					accuracyOpinion: initialData?.secondDeclAccuracyOpinion ?? undefined,
					accuracyDate: initialData?.secondDeclAccuracyDate ?? "",
					...(showSecondDeclarationGap
						? {
								gapConsulted: isSecondDeclarationJustification
									? true
									: (initialData?.secondDeclGapConsulted ?? undefined),
								gapOpinion: initialData?.secondDeclGapOpinion ?? null,
								gapDate: initialData?.secondDeclGapDate ?? null,
							}
						: CLEARED_GAP_FIELDS),
				}
			: undefined,
	};
}

export function normalizeSubmittedOpinions(
	data: OpinionsInput,
	showSecondDeclarationGap: boolean,
	isSecondDeclarationJustification: boolean,
): OpinionsInput {
	if (!data.secondDeclaration) return data;
	if (!showSecondDeclarationGap) {
		return {
			...data,
			secondDeclaration: {
				...data.secondDeclaration,
				...CLEARED_GAP_FIELDS,
			},
		};
	}
	if (isSecondDeclarationJustification) {
		return {
			...data,
			secondDeclaration: {
				...data.secondDeclaration,
				gapConsulted: true,
			},
		};
	}
	return data;
}

export function isGapConsultationIncomplete(
	declaration: OpinionsInput["firstDeclaration"] | undefined,
) {
	return (
		declaration?.gapConsulted === true &&
		(!declaration.gapOpinion || !declaration.gapDate)
	);
}

type DeclarationDraft = {
	accuracyOpinion?: OpinionsInput["firstDeclaration"]["accuracyOpinion"];
	accuracyDate?: string;
	gapConsulted?: boolean;
	gapOpinion?: OpinionsInput["firstDeclaration"]["gapOpinion"];
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
	draft: DeclarationDraft,
	options: { applyGapConsulted: boolean; applyGapDetails: boolean },
) {
	if (draft.accuracyOpinion !== undefined)
		setValue(`${prefix}.accuracyOpinion`, draft.accuracyOpinion);
	if (draft.accuracyDate !== undefined)
		setValue(`${prefix}.accuracyDate`, draft.accuracyDate);
	if (options.applyGapConsulted && draft.gapConsulted !== undefined)
		setValue(`${prefix}.gapConsulted`, draft.gapConsulted);
	if (options.applyGapDetails && draft.gapOpinion !== undefined)
		setValue(`${prefix}.gapOpinion`, draft.gapOpinion);
	if (options.applyGapDetails && draft.gapDate !== undefined)
		setValue(`${prefix}.gapDate`, draft.gapDate);
}

export function hydrateOpinionsForm(
	setValue: SetOpinionsValue,
	draft: OpinionsDraft,
	hasSecondDeclaration: boolean,
	showSecondDeclarationGap: boolean,
	isSecondDeclarationJustification: boolean,
) {
	if (draft.firstDeclaration) {
		applyDeclarationDraft(
			setValue,
			"firstDeclaration",
			draft.firstDeclaration,
			{
				applyGapConsulted: true,
				applyGapDetails: true,
			},
		);
	}
	if (!hasSecondDeclaration) return;
	if (!showSecondDeclarationGap) {
		setValue("secondDeclaration.gapConsulted", CLEARED_GAP_FIELDS.gapConsulted);
		setValue("secondDeclaration.gapOpinion", CLEARED_GAP_FIELDS.gapOpinion);
		setValue("secondDeclaration.gapDate", CLEARED_GAP_FIELDS.gapDate);
	} else if (isSecondDeclarationJustification) {
		setValue("secondDeclaration.gapConsulted", true);
	}
	if (draft.secondDeclaration) {
		applyDeclarationDraft(
			setValue,
			"secondDeclaration",
			draft.secondDeclaration,
			{
				applyGapConsulted:
					showSecondDeclarationGap && !isSecondDeclarationJustification,
				applyGapDetails: showSecondDeclarationGap,
			},
		);
	}
}
