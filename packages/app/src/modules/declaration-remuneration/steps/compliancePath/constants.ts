export const COMPLIANCE_PATHS = [
	"justify",
	"corrective_action",
	"joint_evaluation",
] as const;

export type CompliancePathValue = (typeof COMPLIANCE_PATHS)[number];

export type CompliancePathReadOnlyReason =
	| "demarche_completed"
	| "cse_opinion_submitted"
	| "second_declaration_submitted"
	| "joint_evaluation_submitted"
	| "path_choice_deadline_passed";
