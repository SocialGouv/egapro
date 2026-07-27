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

/**
 * Values the step 5 select offered before #3361. They are no longer
 * selectable, but declarations saved back then still carry them in
 * `app_job.source` (free-form varchar), so every read-only surface must
 * still be able to label them.
 */
const LEGACY_SOURCE_LABELS: Record<string, string> = {
	"convention-collective": "Convention collective",
	"classification-interne": "Classification interne",
	autre: "Autre",
};

/**
 * Every source value we know how to label — the currently selectable ones
 * plus the historical ones. Wider than CATEGORY_SOURCES on purpose: adding
 * a legacy value here must never make it selectable again.
 */
export const SOURCE_LABELS: Record<string, string> = {
	...Object.fromEntries(CATEGORY_SOURCES.map((s) => [s.value, s.label])),
	...LEGACY_SOURCE_LABELS,
};

/**
 * Single source of truth for rendering a stored source value to the user,
 * on every surface (recap page, step 5 read-only, récapitulatif PDF).
 * An unknown value is humanised rather than printed as a raw slug.
 */
export function formatCategorySource(value: string): string {
	const known = SOURCE_LABELS[value];
	if (known) return known;

	const humanised = value.replace(/[-_]+/g, " ").trim();
	if (humanised.length === 0) return value;

	return humanised.charAt(0).toUpperCase() + humanised.slice(1);
}
