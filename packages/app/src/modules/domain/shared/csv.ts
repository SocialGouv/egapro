const FORMULA_PREFIX = /^[=+\-@|\t\r]/;

/** Quote-prefixes a leading formula trigger so a spreadsheet opens the cell as text (CSV injection). */
export function toCsvField(value: unknown): string {
	if (value === null || value === undefined) return '""';
	let field = String(value).replace(/"/g, '""');
	// Strings only: a number carries no formula, and `'-0.05` would publish a negative gap as text.
	if (typeof value === "string" && FORMULA_PREFIX.test(field)) {
		field = `'${field}`;
	}
	return `"${field}"`;
}
