import ExcelJS from "exceljs";

import { DECLARATION_COLUMNS, INDICATOR_G_COLUMNS } from "./shared/constants";
import type { ExportRow, IndicatorGRow } from "./types";

/**
 * Generate an XLSX workbook with two sheets:
 * - "Déclarations" with all declaration data (indicators A, B, F)
 * - "Indicateur G" with job category breakdown
 */
export async function generateXlsx(
	declarationRows: ExportRow[],
	indicatorGRows: IndicatorGRow[],
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();

	addSheet(workbook, "Déclarations", DECLARATION_COLUMNS, declarationRows);

	addSheet(workbook, "Indicateur G", INDICATOR_G_COLUMNS, indicatorGRows);

	const arrayBuffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(arrayBuffer);
}

function addSheet<T extends Record<string, unknown>>(
	workbook: ExcelJS.Workbook,
	sheetName: string,
	columns: Array<{ key: keyof T; header: string }>,
	rows: T[],
): void {
	const sheet = workbook.addWorksheet(sheetName);

	sheet.columns = columns.map((col) => ({
		header: col.header,
		key: String(col.key),
		width: 20,
	}));

	for (const row of rows) {
		const values: Record<string, unknown> = {};
		for (const col of columns) {
			const val = row[col.key];
			values[String(col.key)] = val === null || val === undefined ? null : val;
		}
		sheet.addRow(values);
	}

	const headerRow = sheet.getRow(1);
	headerRow.font = { bold: true };
	headerRow.alignment = { horizontal: "center" };
}
