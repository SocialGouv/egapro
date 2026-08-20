import { representationDraftSchema } from "../schemas";
import type { RepresentationDraft } from "../types";

export type RepresentationDeclarationSnapshot = {
	status: "draft" | "submitted";
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
	if (value == null || value === "") return undefined;
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
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

export function representationDraftFromDeclaration(
	declaration: RepresentationDeclarationSnapshot | null | undefined,
	fallbackStep: number,
): RepresentationDraft {
	if (declaration === null || declaration === undefined) {
		return { currentStep: fallbackStep };
	}
	if (declaration.status === "submitted") {
		return submittedColumnsToDraft(declaration, fallbackStep);
	}
	const parsed = representationDraftSchema.safeParse(declaration.draft);
	return parsed.success ? parsed.data : { currentStep: fallbackStep };
}
