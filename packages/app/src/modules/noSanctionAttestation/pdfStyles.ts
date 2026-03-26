import { StyleSheet } from "@react-pdf/renderer";

import { PDF_FONT_FAMILY } from "~/modules/declarationPdf/pdfFonts";

// @react-pdf/renderer cannot use CSS variables — hex values are required.
// Each constant maps to a DSFR decision token (documented inline).
const TEXT_TITLE_BLUE_FRANCE = "#000091"; // --text-title-blue-france
const BACKGROUND_ALT_GREY = "#F6F6F6"; // --background-alt-grey
const BORDER_DEFAULT_GREY = "#E5E5E5"; // --border-default-grey
const TEXT_DEFAULT_GREY = "#3A3A3A"; // --text-default-grey
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
		marginBottom: 24,
		alignItems: "center",
	},
	republicTitle: {
		fontSize: 10,
		fontWeight: FONT_WEIGHT_BOLD,
		color: TEXT_DEFAULT_GREY,
		marginBottom: 12,
		textTransform: "uppercase",
	},
	title: {
		fontSize: 18,
		fontWeight: FONT_WEIGHT_BOLD,
		color: TEXT_TITLE_BLUE_FRANCE,
		marginBottom: 4,
	},
	section: {
		marginBottom: 16,
	},
	body: {
		fontSize: 11,
		lineHeight: 1.6,
	},
	card: {
		backgroundColor: BACKGROUND_ALT_GREY,
		border: `1 solid ${BORDER_DEFAULT_GREY}`,
		borderRadius: 4,
		padding: 16,
		marginBottom: 16,
	},
	cardTitle: {
		fontSize: 12,
		fontWeight: FONT_WEIGHT_BOLD,
		marginBottom: 8,
	},
	cardField: {
		fontSize: 11,
		marginBottom: 4,
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
