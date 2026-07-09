/** Gap severity classification based on regulatory thresholds. */
export type GapLevel = "low" | "high";

/** Which side a set of pay gaps disfavours, or "balanced" when neither dominates. */
export type GapDirection = "women" | "men" | "balanced";

/** Lifecycle state of a declaration from the user's perspective. */
export type DeclarationStatus = "to_complete" | "in_progress" | "done";

/** FSM status persisted in `declarations.status`; mirrors `declarationStatusEnum` (kept in sync by `declarationFsmStatus.test.ts` — domain layer stays isomorphic, no Drizzle import). */
export type DeclarationFsmStatus =
	| "draft"
	| "awaiting_compliance_path_choice"
	| "corrective_actions_chosen"
	| "joint_evaluation_chosen"
	| "awaiting_revision_choice"
	| "revised_joint_evaluation_chosen"
	| "awaiting_cse_opinion"
	| "demarche_completed";

/** The two types of declarations a company must file each year. */
export type DeclarationType = "remuneration" | "representation";

/** Company size classification for declaration obligations. */
export type CompanySize = "voluntary" | "triennial" | "annual";

/** Workforce range buckets used by admin/public statistics filters. */
export type CompanySizeRange = "<50" | "50-99" | "100-149" | "150-249" | "250+";

/** Configurable campaign deadlines. */
export type CampaignDeadlines = {
	gipPublicationDate: Date | null;
	campaignStartDate: Date | null;
	decl1ModificationDeadline: Date;
	decl1JustificationDeadline: Date;
	decl1JointEvaluationDeadline: Date;
	decl2ModificationDeadline: Date;
	decl2JustificationDeadline: Date;
	decl2JointEvaluationDeadline: Date;
	pathChoiceDeadline: Date;
};
