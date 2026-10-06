const FORMULA_PREFIX = /^[=+\-@|]/;

/**
 * CSV field, semicolon-separated — the separator French spreadsheets open
 * without an import dialog. A leading `=`, `+`, `-`, `@` or `|` is prefixed
 * with a quote so a spreadsheet reads the cell as text instead of evaluating
 * it as a formula.
 */
export function toCsvField(value: unknown): string {
	if (value === null || value === undefined) return '""';
	let field = String(value).replace(/"/g, '""');
	if (FORMULA_PREFIX.test(field)) field = `'${field}`;
	return `"${field}"`;
}
