/** Gap severity classification based on regulatory thresholds. */
export type GapLevel = "low" | "high";

/** Lifecycle state of a declaration from the user's perspective. */
export type DeclarationStatus = "to_complete" | "in_progress" | "done";

/** The two types of declarations a company must file each year. */
export type DeclarationType = "remuneration" | "representation";

/** Company size classification for declaration obligations. */
export type CompanySize = "voluntary" | "triennial" | "annual";
