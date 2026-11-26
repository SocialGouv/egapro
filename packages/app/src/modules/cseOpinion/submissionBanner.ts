import {
	type CompliancePathValue,
	type DeclarationFsmStatus,
	getCurrentCompliancePath,
	isJointEvaluationWritable,
	isSecondDeclarationWritable,
	type LastTransmission,
} from "~/modules/domain";

export type SubmissionBannerVariant = "joint_evaluation" | "second_declaration";

export type SubmissionBannerState = {
	variant: SubmissionBannerVariant;
	depositModifiable: boolean;
} | null;

export function getSubmissionBannerState(declaration: {
	status: DeclarationFsmStatus;
	firstDeclarationPathChoice: CompliancePathValue | null;
	secondDeclarationPathChoice: CompliancePathValue | null;
	hasSubmittedSecondDeclaration: boolean;
	lastTransmission: LastTransmission | null;
}): SubmissionBannerState {
	if (getCurrentCompliancePath(declaration) === "joint_evaluation") {
		return {
			variant: "joint_evaluation",
			depositModifiable: isJointEvaluationWritable(
				declaration.status,
				declaration.lastTransmission,
			),
		};
	}
	if (declaration.hasSubmittedSecondDeclaration) {
		return {
			variant: "second_declaration",
			depositModifiable: isSecondDeclarationWritable(declaration),
		};
	}
	return null;
}
