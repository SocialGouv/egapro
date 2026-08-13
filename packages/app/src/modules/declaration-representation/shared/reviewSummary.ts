import type { RepresentationComplianceVerdict } from "~/modules/domain";
import {
	computeRepresentationVerdict,
	deriveExecutivesNotComputableReason,
	isRepresentationPublicationRequired,
} from "~/modules/domain";
import type { RepresentationDraft } from "../types";

export type RepresentationIndicatorKey = "executives" | "members";

export type RepresentationIndicatorSummary = {
	key: RepresentationIndicatorKey;
	title: string;
	notComputableReason: string | null;
	womenPercent: number | undefined;
	menPercent: number | undefined;
	verdict: RepresentationComplianceVerdict;
};

export type RepresentationSubmitVariant =
	| "two_gaps"
	| "one_gap"
	| "compliant"
	| "not_computable";

export type RepresentationReviewSummary = {
	indicators: RepresentationIndicatorSummary[];
	nonCompliantIndicators: RepresentationIndicatorSummary[];
	publicationApplicable: boolean;
	submitVariant: RepresentationSubmitVariant;
};

export const EXECUTIVES_TITLE = "Cadres dirigeants";
export const MEMBERS_TITLE = "Membres des instances dirigeantes";

const NOT_COMPUTABLE_LABELS = {
	aucun_cadre_dirigeant: "Aucun cadre dirigeant",
	un_seul_cadre_dirigeant: "Un cadre dirigeant",
	aucune_instance_dirigeante: "Aucune instance dirigeante",
} as const;

export function isPublicationApplicable(draft: RepresentationDraft): boolean {
	if (
		draft.executivesCount === undefined ||
		draft.hasManagementBody === undefined
	) {
		return false;
	}
	return isRepresentationPublicationRequired(
		draft.executivesCount,
		draft.hasManagementBody,
	);
}

function summarizeExecutives(
	draft: RepresentationDraft,
	campaignYear: number,
): RepresentationIndicatorSummary {
	const computable = draft.executivesCount === "two_or_more";
	const reason =
		draft.executivesCount === undefined
			? null
			: deriveExecutivesNotComputableReason(draft.executivesCount);

	return {
		key: "executives",
		title: EXECUTIVES_TITLE,
		notComputableReason: reason === null ? null : NOT_COMPUTABLE_LABELS[reason],
		womenPercent: computable ? draft.executiveWomenPercent : undefined,
		menPercent: computable ? draft.executiveMenPercent : undefined,
		verdict: computable
			? computeRepresentationVerdict(
					draft.executiveWomenPercent ?? null,
					draft.executiveMenPercent ?? null,
					campaignYear,
				)
			: "not_applicable",
	};
}

function summarizeMembers(
	draft: RepresentationDraft,
	campaignYear: number,
): RepresentationIndicatorSummary {
	const computable = draft.hasManagementBody === true;

	return {
		key: "members",
		title: MEMBERS_TITLE,
		notComputableReason:
			draft.hasManagementBody === false
				? NOT_COMPUTABLE_LABELS.aucune_instance_dirigeante
				: null,
		womenPercent: computable ? draft.memberWomenPercent : undefined,
		menPercent: computable ? draft.memberMenPercent : undefined,
		verdict: computable
			? computeRepresentationVerdict(
					draft.memberWomenPercent ?? null,
					draft.memberMenPercent ?? null,
					campaignYear,
				)
			: "not_applicable",
	};
}

function pickSubmitVariant(
	indicators: RepresentationIndicatorSummary[],
	nonCompliantCount: number,
): RepresentationSubmitVariant {
	if (nonCompliantCount >= 2) return "two_gaps";
	if (nonCompliantCount === 1) return "one_gap";
	return indicators.some((indicator) => indicator.verdict === "compliant")
		? "compliant"
		: "not_computable";
}

export function summarizeRepresentationReview(
	draft: RepresentationDraft,
	campaignYear: number,
): RepresentationReviewSummary {
	const indicators = [
		summarizeExecutives(draft, campaignYear),
		summarizeMembers(draft, campaignYear),
	];
	const nonCompliantIndicators = indicators.filter(
		(indicator) => indicator.verdict === "non_compliant",
	);

	return {
		indicators,
		nonCompliantIndicators,
		publicationApplicable: isPublicationApplicable(draft),
		submitVariant: pickSubmitVariant(indicators, nonCompliantIndicators.length),
	};
}

const NON_COMPLIANCE_SUBJECTS: Record<RepresentationIndicatorKey, string> = {
	executives: "aux cadres dirigeants",
	members: "aux membres des instances dirigeantes",
};

export function describeNonCompliance(
	nonCompliantIndicators: RepresentationIndicatorSummary[],
): string | null {
	if (nonCompliantIndicators.length === 0) return null;

	const subjects = nonCompliantIndicators.map(
		(indicator) => NON_COMPLIANCE_SUBJECTS[indicator.key],
	);

	return nonCompliantIndicators.length === 1
		? `Vous n'êtes pas conforme concernant l'écart relatif ${subjects[0]}.`
		: `Vous n'êtes pas conforme concernant les écarts relatifs ${subjects.join(" et ")}.`;
}

export function buildRepresentationSubmitPayload(
	draft: RepresentationDraft,
): Record<string, unknown> {
	const payload: Record<string, unknown> = {
		referencePeriodStart: draft.referencePeriodStart,
		referencePeriodEnd: draft.referencePeriodEnd,
		executivesCount: draft.executivesCount,
		hasManagementBody: draft.hasManagementBody,
	};

	if (draft.executivesCount === "two_or_more") {
		payload.executiveWomenPercent = draft.executiveWomenPercent;
		payload.executiveMenPercent = draft.executiveMenPercent;
	}

	if (draft.hasManagementBody === true) {
		payload.memberWomenPercent = draft.memberWomenPercent;
		payload.memberMenPercent = draft.memberMenPercent;
	}

	// `submitRepresentationSchema` rejects publication keys when no gap is computable, and the draft may still hold values typed before a back-and-forth.
	if (isPublicationApplicable(draft)) {
		payload.publishDate = draft.publishDate;
		payload.hasWebsite = draft.hasWebsite;
		if (draft.hasWebsite === true) payload.publishUrl = draft.publishUrl;
		if (draft.hasWebsite === false) {
			payload.publishModalities = draft.publishModalities;
		}
	}

	return payload;
}
