import { ratioToPercentPoints, toCsvField } from "~/modules/domain";

export type CsvColumn<Row> = {
	key: Extract<keyof Row, string>;
	header: string;
	percent?: true;
};

function formatCell<Row>(row: Row, column: CsvColumn<Row>): string {
	const value = row[column.key];
	if (!column.percent) return toCsvField(value);
	return toCsvField(
		ratioToPercentPoints(typeof value === "number" ? value : null),
	);
}

export function toPublicCsv<Row>(
	columns: readonly CsvColumn<Row>[],
	rows: readonly Row[],
): string {
	const header = columns.map(({ header }) => toCsvField(header)).join(";");
	const lines = rows.map((row) =>
		columns.map((column) => formatCell(row, column)).join(";"),
	);
	return [header, ...lines].join("\n");
}
