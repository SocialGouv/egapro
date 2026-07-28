/**
 * Allowed values for the "source de détermination des catégories d'emplois"
 * select on step 5. The order in this array drives the rendered <option>
 * order.
 */
export const CATEGORY_SOURCES = [
	{ value: "accord-entreprise", label: "Accord d'entreprise" },
	{ value: "accord-groupe", label: "Accord de groupe" },
	{ value: "accord-branche", label: "Accord de branche" },
	{ value: "decision-unilaterale", label: "Décision unilatérale" },
] as const;

// Dropped from the select in #3361, but declarations saved before then still
// carry these in app_job.source (free varchar, never migrated).
const LEGACY_SOURCE_LABELS: Record<string, string> = {
	"convention-collective": "Convention collective",
	"classification-interne": "Classification interne",
	autre: "Autre",
};

// Wider than CATEGORY_SOURCES on purpose: labelling a legacy value must never
// make it selectable again.
export const SOURCE_LABELS: Record<string, string> = {
	...Object.fromEntries(CATEGORY_SOURCES.map((s) => [s.value, s.label])),
	...LEGACY_SOURCE_LABELS,
};

export function formatCategorySource(value: string): string {
	const known = SOURCE_LABELS[value];
	if (known !== undefined) return known;

	const humanised = value.replace(/[-_]+/g, " ").trim();
	if (humanised.length === 0) return value;

	return humanised.charAt(0).toUpperCase() + humanised.slice(1);
}
