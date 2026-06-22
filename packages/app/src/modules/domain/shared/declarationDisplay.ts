type CompliancePath = "justify" | "corrective_action" | "joint_evaluation";

type DeclarationLike = {
	firstDeclarationPathChoice: CompliancePath | null;
	secondDeclarationPathChoice: CompliancePath | null;
	cseRequired: boolean;
};

export type DeclarationDisplayContext = {
	firstDeclarationPathChoice: CompliancePath | null;
	secondDeclarationPathChoice: CompliancePath | null;
	shouldShowGapJustification: boolean;
	shouldShowCorrectiveActions: boolean;
	shouldShowJointEvaluation: boolean;
	shouldShowCseOpinion: boolean;
};

export function getDeclarationDisplayContext(
	declaration: DeclarationLike,
): DeclarationDisplayContext {
	const paths = [
		declaration.firstDeclarationPathChoice,
		declaration.secondDeclarationPathChoice,
	];

	return {
		firstDeclarationPathChoice: declaration.firstDeclarationPathChoice,
		secondDeclarationPathChoice: declaration.secondDeclarationPathChoice,
		shouldShowGapJustification: paths.includes("justify"),
		shouldShowCorrectiveActions: paths.includes("corrective_action"),
		shouldShowJointEvaluation: paths.includes("joint_evaluation"),
		shouldShowCseOpinion: declaration.cseRequired,
	};
}
