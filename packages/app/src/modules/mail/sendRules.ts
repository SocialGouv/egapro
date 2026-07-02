import type {
	CseOpinionReceiptVariant,
	DeclarationConfirmationVariant,
	JointEvaluationSubmittedVariant,
} from "notifications/queue";

export type DeclarationConfirmationContext = {
	hasGapAboveThreshold: boolean;
	cseRequired: boolean;
};

export function selectDeclarationConfirmationVariant(
	context: DeclarationConfirmationContext,
): DeclarationConfirmationVariant {
	if (context.hasGapAboveThreshold) return "path_to_select";
	if (context.cseRequired) return "cse_to_deposit";
	return "completed";
}

export type JointEvaluationSubmittedContext = {
	hasSecondDeclaration: boolean;
	cseOpinionExpected: boolean;
};

export function selectJointEvaluationSubmittedVariant(
	context: JointEvaluationSubmittedContext,
): JointEvaluationSubmittedVariant {
	if (context.hasSecondDeclaration) return "cse_first_and_second";
	if (context.cseOpinionExpected) return "cse_to_deposit";
	return "completed";
}

export type CseOpinionReceiptContext = {
	forFirstAndSecondDeclaration: boolean;
	hasGapAboveThreshold: boolean;
};

export function selectCseOpinionReceiptVariant(
	context: CseOpinionReceiptContext,
): CseOpinionReceiptVariant {
	if (context.forFirstAndSecondDeclaration) return "first_and_second";
	if (context.hasGapAboveThreshold) return "with_gap";
	return "single";
}
