import {
	buildSuitValueTablesPage,
	type SuitFieldTable,
	type SuitHomonym,
	type SuitValueTablesPage,
} from "./suitValueTables";

// Pipes would split the surrounding Markdown cell.
function escapeCell(text: string): string {
	return text.replaceAll("|", "\\|");
}

function renderRow(cells: string[]): string {
	return `| ${cells.map(escapeCell).join(" | ")} |`;
}

function renderTable(headers: string[], rows: string[][]): string[] {
	return [
		renderRow(headers),
		`| ${headers.map(() => "---").join(" | ")} |`,
		...rows.map(renderRow),
	];
}

function renderHomonym(homonym: SuitHomonym): string[] {
	return [
		`### \`${homonym.name}\``,
		"",
		...renderTable(
			["Champ", "Signification"],
			homonym.occurrences.map((occurrence) => [
				occurrence.field,
				occurrence.meaning,
			]),
		),
		"",
	];
}

function renderFieldTable(table: SuitFieldTable): string[] {
	const hasLabels = table.rows.some((row) => row.label !== null);

	const headers = ["Valeur"];
	if (hasLabels) headers.push("Libellé FR");
	if (table.extraColumn !== null) headers.push(table.extraColumn);
	headers.push("Signification");

	const rows = table.rows.map((row) => {
		const cells = [`\`${row.value}\``];
		if (hasLabels) cells.push(row.label ?? "—");
		if (table.extraColumn !== null) cells.push(row.extra ?? "—");
		cells.push(row.meaning);
		return cells;
	});

	return [
		`### \`${table.field}\``,
		"",
		table.description,
		"",
		`- **Endpoint** : \`${table.endpoint}\``,
		`- **Présence** : ${table.presence}`,
		`- **Source** : ${table.sources.join(" ; ")}`,
		"",
		...renderTable(headers, rows),
		"",
	];
}

export function renderSuitValueTablesMarkdown(
	page: SuitValueTablesPage,
): string {
	const lines = [
		"# API SUIT — tables de valeurs des champs énumérés",
		"",
		"> **Page générée depuis le code. Ne pas la modifier à la main : toute édition sera écrasée.**",
		">",
		`> Régénération : \`${page.regenerateCommand}\`. Tant qu'elle n'est pas régénérée, la suite de tests échoue.`,
		">",
		"> Sources lues :",
		">",
		...page.sources.map((source) => `> - ${source}`),
		"",
		`Les valeurs ci-dessous complètent [\`SUIT-API.md\`](SUIT-API.md). Les libellés d'étape proviennent du ruleset \`v${page.rulesVersion}\`.`,
		"",
		"## Champs homonymes",
		"",
		"Plusieurs champs du payload portent le même nom sans porter le même vocabulaire. Les voici, avant les tables.",
		"",
		...page.homonyms.flatMap(renderHomonym),
		"## Tables de valeurs",
		"",
		...page.tables.flatMap(renderFieldTable),
	];

	return `${lines.join("\n").trimEnd()}\n`;
}

export function renderSuitValueTablesPage(): string {
	return renderSuitValueTablesMarkdown(buildSuitValueTablesPage());
}
