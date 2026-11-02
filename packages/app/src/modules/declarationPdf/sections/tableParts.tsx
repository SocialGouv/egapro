import { Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { type PdfStyles, styles } from "../recapPdfStyles";
import {
	type PdfStructureProps,
	pdfStructure,
	pdfTag,
} from "../tagging/pdfStructure";

type Align = "left" | "right";

// Marianne (react-pdf) has no glyph for U+202F (the fr-FR thousands separator
// emitted by toLocaleString) — it renders as a stray slash. Swap for U+00A0.
// Nor for the superscript "ᵉʳ" formatLongDate writes on the first of a month:
// react-pdf falls back to a Helvetica it never embeds, which breaks PDF/UA-1.
export function normalizePdfText(value: string): string {
	return value.replace(/\u202F/g, "\u00A0").replace(/\u1D49\u02B3/g, "er");
}

export function Table({
	children,
	sheet = styles,
}: {
	children: ReactNode;
	sheet?: PdfStyles;
}) {
	return (
		<View {...pdfTag("Table")} style={sheet.table} wrap={false}>
			{children}
		</View>
	);
}

export function Row({ children }: { children: ReactNode }) {
	return (
		<View {...pdfTag("TR")} style={styles.row}>
			{children}
		</View>
	);
}

type CellProps = {
	width?: number;
	flex?: number;
	header?: boolean;
	rowHeader?: boolean;
	columnSpan?: number;
	bold?: boolean;
	align?: Align;
	text?: string;
	hint?: string;
	children?: ReactNode;
	sheet?: PdfStyles;
};

function cellStructure({
	header,
	rowHeader,
	columnSpan,
	isEmpty,
}: Pick<CellProps, "header" | "rowHeader" | "columnSpan"> & {
	isEmpty: boolean;
}): PdfStructureProps {
	if (header && !isEmpty) {
		return pdfStructure({ tag: "TH", scope: "Column", columnSpan });
	}
	if (rowHeader) return pdfStructure({ tag: "TH", scope: "Row", columnSpan });
	return pdfTag("TD");
}

export function Cell({
	width,
	flex,
	header,
	rowHeader,
	columnSpan,
	bold,
	align = "left",
	text,
	hint,
	children,
	sheet = styles,
}: CellProps) {
	const sizing = width !== undefined ? { width } : { flex: flex ?? 1 };
	const textStyle =
		bold || header || rowHeader ? sheet.cellTextBold : sheet.cellText;
	const cellStyle = header
		? [sheet.cell, sheet.headerCell, sizing]
		: [sheet.cell, sizing];
	return (
		<View
			{...cellStructure({
				header,
				rowHeader,
				columnSpan,
				isEmpty: text === undefined && children === undefined,
			})}
			style={cellStyle}
		>
			{text !== undefined ? (
				<Text style={[textStyle, { textAlign: align }]}>
					{normalizePdfText(text)}
				</Text>
			) : null}
			{hint !== undefined ? (
				<Text style={sheet.headerHint}>{normalizePdfText(hint)}</Text>
			) : null}
			{children}
		</View>
	);
}
