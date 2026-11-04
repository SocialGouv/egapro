import { type PdfStyles, styles } from "./recapPdfStyles";

const TEXT_LINE_HEIGHT = "15pt";

export const representationStyles: PdfStyles = {
	...styles,
	// Not on the page: react-pdf re-resolves it when relaying out the dynamic page counter.
	header: { ...styles.header, lineHeight: TEXT_LINE_HEIGHT },
	banner: { ...styles.banner, lineHeight: TEXT_LINE_HEIGHT },
	content: { ...styles.content, lineHeight: TEXT_LINE_HEIGHT },
	title: { ...styles.title, lineHeight: "24pt" },
	infoBody: { ...styles.infoBody, marginBottom: 12 },
	// The gap below the indicator columns lives on their row, table or not.
	table: { ...styles.table, marginBottom: 0 },
	// Figma's table rows are 24pt with the border: 3.5 + 15 + 3.5 + 1, rounded up.
	cell: { ...styles.cell, paddingVertical: 3.5, minHeight: 23 },
};
