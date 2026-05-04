/**
 * Allowed values for the "source de détermination des catégories d'emplois"
 * select on step 5. The order in this array drives the rendered <option>
 * order; the value/label split lets the read-only recap reuse the same labels.
 */
export const CATEGORY_SOURCES = [
	{ value: "accord-entreprise", label: "Accord d'entreprise" },
	{ value: "accord-groupe", label: "Accord de groupe" },
	{ value: "accord-branche", label: "Accord de branche" },
	{ value: "decision-unilaterale", label: "Décision unilatérale" },
] as const;

export const SOURCE_LABELS: Record<string, string> = Object.fromEntries(
	CATEGORY_SOURCES.map((s) => [s.value, s.label]),
);
