import { StyleSheet } from "@react-pdf/renderer";

import { styles } from "./recapPdfStyles";
import type { PdfStyles } from "./sections/pdfStylesContext";

const TEXT_LINE_HEIGHT = "15pt";

export const prefillStyles: PdfStyles = {
	...styles,
	// Not on the page: react-pdf re-resolves it when relaying out the dynamic page counter.
	header: { ...styles.header, lineHeight: TEXT_LINE_HEIGHT },
	banner: { ...styles.banner, lineHeight: TEXT_LINE_HEIGHT },
	content: { ...styles.content, lineHeight: TEXT_LINE_HEIGHT },
	title: { ...styles.title, lineHeight: "24pt" },
	titleBlock: { ...styles.titleBlock, marginBottom: 10 },
	sectionBanner: { ...styles.sectionBanner, marginTop: 0 },
	infoBody: { ...styles.infoBody, marginBottom: 12 },
	// Figma draws the top border inside the first row; ours adds 1pt, given back here.
	table: { ...styles.table, marginBottom: 5 },
	// Figma's two-line cells are 38pt with the border inside: 3.5 + 30 + 3.5 + 1.
	cell: { ...styles.cell, paddingVertical: 3.5 },
	headerHint: { ...styles.headerHint, marginTop: 0 },
	badgeText: { ...styles.badgeText, lineHeight: "13pt" },
};

export const prefillLayout = StyleSheet.create({
	sectionGap: {
		height: 4,
	},
});
