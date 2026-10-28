// Domain re-exports (canonical source: ~/modules/domain)
export type {
	DeclarationFsmStatus,
	DeclarationStatus,
	DeclarationType,
} from "~/modules/domain";

import type {
	DeclarationFsmStatus,
	DeclarationStatus,
	DeclarationType,
} from "~/modules/domain";

export type CompanyDetail = {
	siren: string;
	name: string;
	address: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	countryCode: string | null;
	countryLabel: string | null;
	departmentLabel: string | null;
	gipWorkforce: number | null;
	hasCse: boolean | null;
};

type CompliancePath = "justify" | "corrective_action" | "joint_evaluation";

export type LockHolderDisplay = {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
};

export type DeclarationItem = {
	type: DeclarationType;
	siren: string;
	year: number;
	status: DeclarationStatus;
	fsmStatus: DeclarationFsmStatus | null;
	currentStep: number;
	updatedAt: Date | null;
	firstDeclarationPathChoice: CompliancePath | null;
	secondDeclarationPathChoice: CompliancePath | null;
	hasSubmittedSecondDeclaration: boolean;
	secondDeclarationStep: number | null;
	hasSubmittedJointEvaluation: boolean;
	hasSubmittedCseOpinion: boolean;
	cseOpinionViewAvailable?: boolean;
	jointEvaluationViewAvailable?: boolean;
	cseRequired: boolean;
	hasJointEvaluationFile: boolean;
	formalNoticeAvailable: boolean;
	hasSubmittedFormalNoticeJointEvaluation: boolean;
	hasPrefillData: boolean;
	deadline: Date | null;
	notSubject: boolean;
};
