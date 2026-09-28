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
	isFirstDeclarationJustification = false,
	showFirstDeclarationGap = true,
) {
	return {
		firstDeclaration: {
			accuracyOpinion: initialData?.firstDeclAccuracyOpinion ?? undefined,
			accuracyDate: initialData?.firstDeclAccuracyDate ?? "",
			...(showFirstDeclarationGap
				? {
						gapConsulted: isFirstDeclarationJustification
							? true
							: (initialData?.firstDeclGapConsulted ?? undefined),
						gapOpinion: initialData?.firstDeclGapOpinion ?? null,
						gapDate: initialData?.firstDeclGapDate ?? null,
					}
				: CLEARED_GAP_FIELDS),
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
	isFirstDeclarationJustification = false,
	showFirstDeclarationGap = true,
): OpinionsInput {
	// Dropped together: a persisted opinion beside a false gapConsulted reaches the PDF and the open data as a self-contradictory row.
	const normalized = !showFirstDeclarationGap
		? {
				...data,
				firstDeclaration: { ...data.firstDeclaration, ...CLEARED_GAP_FIELDS },
			}
		: isFirstDeclarationJustification
			? {
					...data,
					firstDeclaration: { ...data.firstDeclaration, gapConsulted: true },
				}
			: data;
	if (!normalized.secondDeclaration) return normalized;
	if (!showSecondDeclarationGap) {
		return {
			...normalized,
			secondDeclaration: {
				...normalized.secondDeclaration,
				...CLEARED_GAP_FIELDS,
			},
		};
	}
	if (isSecondDeclarationJustification) {
		return {
			...normalized,
			secondDeclaration: {
				...normalized.secondDeclaration,
				gapConsulted: true,
			},
		};
	}
	return normalized;
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
	isFirstDeclarationJustification = false,
	showFirstDeclarationGap = true,
) {
	if (!showFirstDeclarationGap) {
		setValue("firstDeclaration.gapConsulted", CLEARED_GAP_FIELDS.gapConsulted);
		setValue("firstDeclaration.gapOpinion", CLEARED_GAP_FIELDS.gapOpinion);
		setValue("firstDeclaration.gapDate", CLEARED_GAP_FIELDS.gapDate);
	} else if (isFirstDeclarationJustification) {
		setValue("firstDeclaration.gapConsulted", true);
	}
	if (draft.firstDeclaration) {
		applyDeclarationDraft(
			setValue,
			"firstDeclaration",
			draft.firstDeclaration,
			{
				applyGapConsulted:
					showFirstDeclarationGap && !isFirstDeclarationJustification,
				applyGapDetails: showFirstDeclarationGap,
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
