export const COMPLIANCE_PATHS = [
	"justify",
	"corrective_action",
	"joint_evaluation",
] as const;

export type CompliancePathValue = (typeof COMPLIANCE_PATHS)[number];
