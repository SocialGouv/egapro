/** Gap severity classification based on regulatory thresholds. */
export type GapLevel = "low" | "high";

/** Which side a set of pay gaps disfavours, or "balanced" when neither dominates. */
export type GapDirection = "women" | "men" | "balanced";

/** Lifecycle state of a declaration from the user's perspective. `closed_incomplete`/`closed_not_done` are reached only via `applyDeclarationClosure` (a past-year row past its step deadline) — `computeDeclarationStatus` itself never returns them. */
export type DeclarationStatus =
	| "to_complete"
	| "in_progress"
	| "done"
	| "closed_incomplete"
	| "closed_not_done";

/** FSM status persisted in `declarations.status`; mirrors `declarationStatusEnum` (kept in sync by `declarationFsmStatus.test.ts` — domain layer stays isomorphic, no Drizzle import). Single source for the FSM state vocabulary: the rule-engine schema (`server/rules/schema.ts`) and every UI mirror derive from this const, so adding/renaming a state surfaces as a `tsc` or Zod error, never a silent production bug. */
export const DECLARATION_FSM_STATUSES = [
	"draft",
	"awaiting_compliance_path_choice",
	"corrective_actions_chosen",
	"joint_evaluation_chosen",
	"awaiting_revision_choice",
	"revised_joint_evaluation_chosen",
	"awaiting_cse_opinion",
	"demarche_completed",
] as const;

export type DeclarationFsmStatus = (typeof DECLARATION_FSM_STATUSES)[number];

/** The two types of declarations a company must file each year. */
export type DeclarationType = "remuneration" | "representation";

/**
 * Company size classification by obligation package.
 * `voluntary` (< 50): voluntary declaration; `mandatory` (50-99): annual declaration
 * without gap-alert obligations; `mandatory_with_compliance` (>= 100): annual
 * declaration + CSE opinion + gap-alert (>= 5%) obligations.
 */
export type CompanySize =
	| "voluntary"
	| "mandatory"
	| "mandatory_with_compliance";

/** Workforce range buckets used by admin/public statistics filters. */
export type CompanySizeRange = "<50" | "50-99" | "100-149" | "150-249" | "250+";

/**
 * Workforce brackets of the public observatory search facet. Deliberately not
 * `CompanySizeRange`: that one splits 100-249 in two for the statistics
 * dashboards, while the observatory groups it and caps at 1000.
 */
export type ObservatoryWorkforceRange =
	| "<50"
	| "50-99"
	| "100-249"
	| "250-999"
	| "1000+";

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
	decl2CseOpinionDeadline: Date;
	pathChoiceDeadline: Date;
	pathChoiceRound1Deadline: Date;
};

export type RepresentationCampaign = {
	campaignStartDate: Date;
	campaignEndDate: Date;
	declarationDeadline: Date;
};
