import type { RepresentationDeclarationStatus } from "~/modules/domain";
import { toNullableNumber } from "~/modules/domain";
import { representationDraftSchema } from "../schemas";
import type { RepresentationDraft } from "../types";

export type RepresentationDeclarationSnapshot = {
	status: RepresentationDeclarationStatus;
	currentStep: number | null;
	draft: unknown;
	referencePeriodStart: string | Date | null;
	referencePeriodEnd: string | Date | null;
	executiveWomenPercent: string | number | null;
	executiveMenPercent: string | number | null;
	notComputableReasonExecutives:
		| "aucun_cadre_dirigeant"
		| "un_seul_cadre_dirigeant"
		| null;
	memberWomenPercent: string | number | null;
	memberMenPercent: string | number | null;
	notComputableReasonMembers: "aucune_instance_dirigeante" | null;
	publishDate: string | Date | null;
	publishUrl: string | null;
	publishModalities: string | null;
};

function toIsoDate(
	value: string | Date | null | undefined,
): string | undefined {
	if (value == null) return undefined;
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return value;
}

function toPercent(
	value: string | number | null | undefined,
): number | undefined {
	return toNullableNumber(value) ?? undefined;
}

function submittedColumnsToDraft(
	declaration: RepresentationDeclarationSnapshot,
	fallbackStep: number,
): RepresentationDraft {
	const executivesCount =
		declaration.notComputableReasonExecutives === "aucun_cadre_dirigeant"
			? "none"
			: declaration.notComputableReasonExecutives === "un_seul_cadre_dirigeant"
				? "one"
				: "two_or_more";
	const hasManagementBody =
		declaration.notComputableReasonMembers !== "aucune_instance_dirigeante";
	const hasWebsite =
		declaration.publishUrl !== null
			? true
			: declaration.publishModalities !== null
				? false
				: undefined;

	return {
		currentStep: declaration.currentStep ?? fallbackStep,
		referencePeriodStart: toIsoDate(declaration.referencePeriodStart),
		referencePeriodEnd: toIsoDate(declaration.referencePeriodEnd),
		executivesCount,
		executiveWomenPercent:
			executivesCount === "two_or_more"
				? toPercent(declaration.executiveWomenPercent)
				: undefined,
		executiveMenPercent:
			executivesCount === "two_or_more"
				? toPercent(declaration.executiveMenPercent)
				: undefined,
		hasManagementBody,
		memberWomenPercent: hasManagementBody
			? toPercent(declaration.memberWomenPercent)
			: undefined,
		memberMenPercent: hasManagementBody
			? toPercent(declaration.memberMenPercent)
			: undefined,
		hasWebsite,
		publishDate: toIsoDate(declaration.publishDate),
		publishUrl: declaration.publishUrl ?? undefined,
		publishModalities: declaration.publishModalities ?? undefined,
	};
}

/**
 * Funnel loader: an edit saved after the transmission lands in `draft` while
 * the row keeps the `submitted` status, so the saved draft wins over the
 * transmitted columns it was derived from. A transmitted row without a draft is
 * rebuilt from its columns.
 */
export function representationDraftFromDeclaration(
	declaration: RepresentationDeclarationSnapshot | null | undefined,
	fallbackStep: number,
): RepresentationDraft {
	if (declaration === null || declaration === undefined) {
		return { currentStep: fallbackStep };
	}
	const parsed = representationDraftSchema.safeParse(declaration.draft);
	if (parsed.success) return parsed.data;
	if (declaration.status === "submitted") {
		return submittedColumnsToDraft(declaration, fallbackStep);
	}
	return { currentStep: fallbackStep };
}

/**
 * What was actually transmitted — the consultation view and the receipt PDF
 * must never display an edit that was not re-transmitted.
 */
export function representationTransmittedDraftFromDeclaration(
	declaration: RepresentationDeclarationSnapshot | null | undefined,
	fallbackStep: number,
): RepresentationDraft {
	if (declaration?.status === "submitted") {
		return submittedColumnsToDraft(declaration, fallbackStep);
	}
	return representationDraftFromDeclaration(declaration, fallbackStep);
}
