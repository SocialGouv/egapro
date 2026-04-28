/** Gap severity classification based on regulatory thresholds. */
export type GapLevel = "low" | "high";

/** Lifecycle state of a declaration from the user's perspective. */
export type DeclarationStatus = "to_complete" | "in_progress" | "done";

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
};
