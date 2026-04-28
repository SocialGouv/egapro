/**
 * Pure helper functions for post-process-schema-wiki.mjs.
 * Kept in src/ so they can be imported via the ~/ alias in tests.
 */

export const COMMENT_HEADER = "Commentaire";

/**
 * Convert camelCase column name to snake_case for map lookup.
 * db-schema-toolkit outputs camelCase names; schema-comments.ts uses snake_case.
 *
 * Example: indicatorAAnnualWomen → indicator_a_annual_women
 */
export function camelToSnake(str: string): string {
	return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}

/** Escape pipe characters in a cell value so they don't break the Markdown table. */
export function escapeCell(value: string): string {
	return value.replace(/\|/g, "\\|");
}

/** Split a table row into cells, ignoring escaped pipes (\|). */
export function parseCells(line: string): string[] {
	return line
		.split(/(?<!\\)\|/)
		.slice(1, -1)
		.map((c) => c.trim());
}

type InjectResult = { lines: string[]; injected: number };

/**
 * Given a set of markdown table lines (header + separator + data rows),
 * inject or update the Commentaire column using the provided column→comment map.
 * Returns { lines, injected }.
 */
export function injectComments(
	tableLines: string[],
	columnComments: Record<string, string>,
): InjectResult {
	if (tableLines.length < 2) return { lines: tableLines, injected: 0 };

	// tableLines.length >= 2 is guaranteed by the guard above.
	const headerLine = tableLines[0] as string;
	const separatorLine = tableLines[1] as string;
	const dataLines = tableLines.slice(2);

	const headerCells = parseCells(headerLine);
	const commentColIndex = headerCells.indexOf(COMMENT_HEADER);
	const columnNameIndex = 0;

	let injected = 0;

	if (commentColIndex !== -1) {
		// Column already exists — update values in existing cells.
		const newData = dataLines.map((line) => {
			const cells = parseCells(line);
			const rawColumnName = cells[columnNameIndex] ?? "";
			const snakeKey = camelToSnake(rawColumnName);
			const existing = cells[commentColIndex] ?? "";
			const rawComment = columnComments[snakeKey] ?? existing;
			const comment = escapeCell(rawComment);
			if (comment && comment !== existing) injected++;
			cells[commentColIndex] = comment;
			return `| ${cells.join(" | ")} |`;
		});
		return { lines: [headerLine, separatorLine, ...newData], injected };
	}

	// Add a new Commentaire column.
	const newHeader = `${headerLine.trimEnd().replace(/\|$/, "")}| ${COMMENT_HEADER} |`;
	const newSeparator = `${separatorLine.trimEnd().replace(/\|$/, "")}| --- |`;
	const newData = dataLines.map((line) => {
		const cells = parseCells(line);
		const rawColumnName = cells[columnNameIndex] ?? "";
		const snakeKey = camelToSnake(rawColumnName);
		const comment = escapeCell(columnComments[snakeKey] ?? "");
		if (comment) injected++;
		return `${line.trimEnd().replace(/\|$/, "")}| ${comment} |`;
	});

	return { lines: [newHeader, newSeparator, ...newData], injected };
}
