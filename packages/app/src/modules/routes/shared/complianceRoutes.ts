import { route } from "./routeContract";
import { toStep } from "./stepDomain";

export const COMPLIANCE_PATH = route(
	"/declaration-remuneration/parcours-conformite",
);
export const COMPLIANCE_JOINT_EVALUATION = route(
	"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
);
export const COMPLIANCE_CONFIRMATION = route(
	"/declaration-remuneration/parcours-conformite/confirmation",
);

export const COMPLIANCE_STEP_NUMBERS = [1, 2, 3] as const;

export type ComplianceStep = (typeof COMPLIANCE_STEP_NUMBERS)[number];

const COMPLIANCE_STEP_ROUTES = {
	1: route("/declaration-remuneration/parcours-conformite/etape/1"),
	2: route("/declaration-remuneration/parcours-conformite/etape/2"),
	3: route("/declaration-remuneration/parcours-conformite/etape/3"),
} as const;

export type ComplianceStepRoute =
	(typeof COMPLIANCE_STEP_ROUTES)[ComplianceStep];

export function toComplianceStep(step: number): ComplianceStep | null {
	return toStep(COMPLIANCE_STEP_NUMBERS, step);
}

export function complianceStepHref(step: ComplianceStep): ComplianceStepRoute {
	return COMPLIANCE_STEP_ROUTES[step];
}

export const CSE_OPINION = route("/avis-cse");
export const CSE_OPINION_CONFIRMATION = route("/avis-cse/confirmation");

export const CSE_OPINION_STEP_NUMBERS = [1, 2] as const;

export type CseOpinionStep = (typeof CSE_OPINION_STEP_NUMBERS)[number];

const CSE_OPINION_STEP_ROUTES = {
	1: route("/avis-cse/etape/1"),
	2: route("/avis-cse/etape/2"),
} as const;

export type CseOpinionStepRoute =
	(typeof CSE_OPINION_STEP_ROUTES)[CseOpinionStep];

export function toCseOpinionStep(step: number): CseOpinionStep | null {
	return toStep(CSE_OPINION_STEP_NUMBERS, step);
}

export function cseOpinionStepHref(step: CseOpinionStep): CseOpinionStepRoute {
	return CSE_OPINION_STEP_ROUTES[step];
}
