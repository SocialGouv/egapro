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

export type CompanyItem = {
	siren: string;
	name: string;
	declarationStatus: DeclarationStatus;
};

export type ViewMode = "list" | "table";

export type CompanyDetail = {
	siren: string;
	name: string;
	address: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	workforce: number | null;
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
	hasSubmittedCseOpinion: boolean;
	cseRequired: boolean;
	hasJointEvaluationFile: boolean;
	hasPrefillData: boolean;
};
