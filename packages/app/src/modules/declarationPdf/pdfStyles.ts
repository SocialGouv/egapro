import { StyleSheet } from "@react-pdf/renderer";

import { PDF_FONT_FAMILY } from "./pdfFonts";

// @react-pdf/renderer cannot use CSS variables — hex values are required.
// Each constant maps to a DSFR decision token (documented inline).
const TEXT_TITLE_BLUE_FRANCE = "#000091"; // --text-title-blue-france
const BACKGROUND_ALT_BLUE_FRANCE = "#E3E3FD"; // --background-alt-blue-france (light variant)
const BACKGROUND_ALT_GREY = "#F6F6F6"; // --background-alt-grey
const BORDER_DEFAULT_GREY = "#E5E5E5"; // --border-default-grey
const TEXT_DEFAULT_GREY = "#3A3A3A"; // --text-default-grey
const BACKGROUND_FLAT_ERROR = "#FFE9E6"; // --background-contrast-error (light variant)
const TEXT_DEFAULT_ERROR = "#CE0500"; // --text-default-error
const TEXT_TITLE_GREY = "#161616"; // --text-title-grey
const FONT_WEIGHT_BOLD = 700;

export const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontFamily: PDF_FONT_FAMILY,
		fontSize: 10,
		color: TEXT_TITLE_GREY,
	},
	header: {
		marginBottom: 20,
	},
	title: {
		fontSize: 16,
		fontWeight: FONT_WEIGHT_BOLD,
		color: TEXT_TITLE_BLUE_FRANCE,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 11,
		color: TEXT_DEFAULT_GREY,
		marginBottom: 8,
	},
	companyInfo: {
		fontSize: 10,
		marginBottom: 2,
	},
	card: {
		backgroundColor: BACKGROUND_ALT_GREY,
		border: `1 solid ${BORDER_DEFAULT_GREY}`,
		borderRadius: 4,
		padding: 12,
		marginBottom: 10,
	},
	cardTitle: {
		fontSize: 11,
		fontWeight: FONT_WEIGHT_BOLD,
		marginBottom: 8,
	},
	tableRow: {
		flexDirection: "row",
		borderBottom: `1 solid ${BORDER_DEFAULT_GREY}`,
		paddingVertical: 3,
		alignItems: "center",
	},
	tableRowLast: {
		flexDirection: "row",
		paddingVertical: 3,
		alignItems: "center",
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: BACKGROUND_ALT_BLUE_FRANCE,
		paddingVertical: 4,
		paddingHorizontal: 2,
		borderRadius: 2,
		marginBottom: 2,
	},
	tableHeaderText: {
		fontSize: 8,
		fontWeight: FONT_WEIGHT_BOLD,
		color: TEXT_TITLE_BLUE_FRANCE,
	},
	tableCellLabel: {
		flex: 3,
		fontSize: 9,
	},
	tableCellLabelBold: {
		flex: 3,
		fontSize: 9,
		fontWeight: FONT_WEIGHT_BOLD,
	},
	tableCellValue: {
		flex: 2,
		fontSize: 9,
		textAlign: "right",
	},
	tableCellValueBold: {
		flex: 2,
		fontSize: 9,
		textAlign: "right",
		fontWeight: FONT_WEIGHT_BOLD,
	},
	tableCellGap: {
		flex: 2,
		fontSize: 9,
		textAlign: "right",
		fontWeight: FONT_WEIGHT_BOLD,
	},
	badgeRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
	},
	badge: {
		fontSize: 7,
		paddingHorizontal: 3,
		paddingVertical: 1,
		borderRadius: 2,
		marginLeft: 3,
	},
	badgeLow: {
		backgroundColor: BACKGROUND_ALT_BLUE_FRANCE,
		color: TEXT_TITLE_BLUE_FRANCE,
	},
	badgeHigh: {
		backgroundColor: BACKGROUND_FLAT_ERROR,
		color: TEXT_DEFAULT_ERROR,
	},
	sectionLabel: {
		fontSize: 9,
		fontWeight: FONT_WEIGHT_BOLD,
		marginBottom: 4,
		marginTop: 6,
	},
	noData: {
		fontSize: 9,
		color: TEXT_DEFAULT_GREY,
		fontStyle: "italic",
	},
	proportionRow: {
		flexDirection: "row",
		gap: 16,
		marginTop: 6,
	},
	proportionItem: {
		flex: 1,
	},
	proportionLabel: {
		fontSize: 8,
		color: TEXT_DEFAULT_GREY,
		marginBottom: 2,
	},
	proportionValue: {
		fontSize: 10,
		fontWeight: FONT_WEIGHT_BOLD,
	},
	categoryBlock: {
		marginBottom: 6,
	},
	footer: {
		position: "absolute",
		bottom: 30,
		left: 40,
		right: 40,
		fontSize: 8,
		color: TEXT_DEFAULT_GREY,
		textAlign: "center",
	},
});
