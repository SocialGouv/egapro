import { StyleSheet } from "@react-pdf/renderer";

import { PDF_FONT_FAMILY } from "./pdfFonts";

// @react-pdf/renderer cannot use CSS variables — hex values are required.
// Each constant maps to a DSFR decision token read from the Figma maquette
// (file axsrSDEVqsrFvHdWrZJIkQ). Kept separate from pdfStyles.ts, which stays
// frozen for TransmittedPdfDocument / PrefillPdfDocument.
const TEXT_TITLE_GREY = "#161616"; // $text-title-grey
const TEXT_DEFAULT_GREY = "#3A3A3A"; // $text-default-grey
const BACKGROUND_ALT_GREY = "#F6F6F6"; // $background-alt-grey (header cells)
const BACKGROUND_GREY_ACTIVE = "#EDEDED"; // $background-default-grey-active (section banners)
const BACKGROUND_ALT_BLUE_FRANCE = "#F5F5FE"; // $background-alt-blue-france (egapro + category banners)
const BORDER_CONTRAST_GREY = "#929292"; // $border-contrast-grey (table grid)
const BACKGROUND_CONTRAST_WARNING = "#FFE9E6"; // $background-contrast-warning (badge fill)
const TEXT_DEFAULT_WARNING = "#B34000"; // $text-default-warning (badge text)
const WHITE = "#FFFFFF";

const REGULAR = 400;
const BOLD = 700;

export const HEADER_HEIGHT = 98;
export const FOOTER_HEIGHT = 56;
export const CONTENT_MARGIN = 35;
export const CONTENT_WIDTH = 525; // 595 (A4 width in pt) − 2 × 35

export const styles = StyleSheet.create({
	page: {
		fontFamily: PDF_FONT_FAMILY,
		fontSize: 9,
		color: TEXT_TITLE_GREY,
		paddingTop: HEADER_HEIGHT + 8,
		paddingBottom: FOOTER_HEIGHT,
	},

	header: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: HEADER_HEIGHT,
		paddingTop: 24,
		paddingHorizontal: 24,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	headerLogo: {
		width: 107,
		height: 74,
	},
	headerText: {
		fontSize: 11,
		fontWeight: BOLD,
		color: TEXT_TITLE_GREY,
		textAlign: "right",
	},

	footer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: FOOTER_HEIGHT,
		paddingTop: 7,
		paddingHorizontal: CONTENT_MARGIN,
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
	},
	footerText: {
		fontSize: 9,
		color: TEXT_DEFAULT_GREY,
	},

	banner: {
		backgroundColor: BACKGROUND_ALT_BLUE_FRANCE,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: CONTENT_MARGIN,
		paddingVertical: 8,
	},
	bannerTitle: {
		fontSize: 12,
		fontWeight: BOLD,
		color: TEXT_TITLE_GREY,
	},
	bannerSubtitle: {
		fontSize: 9,
		color: TEXT_TITLE_GREY,
		marginTop: 4,
	},
	bannerIcon: {
		width: 40,
		height: 40,
	},

	content: {
		marginHorizontal: CONTENT_MARGIN,
	},

	titleBlock: {
		marginTop: 8,
		marginBottom: 10,
	},
	title: {
		fontSize: 12,
		fontWeight: BOLD,
		color: TEXT_TITLE_GREY,
	},
	titleDate: {
		fontSize: 9,
		color: TEXT_TITLE_GREY,
		marginTop: 6,
	},

	sectionBanner: {
		backgroundColor: BACKGROUND_GREY_ACTIVE,
		paddingHorizontal: 8,
		paddingVertical: 4,
		marginTop: 10,
	},
	sectionBannerText: {
		fontSize: 9,
		fontWeight: BOLD,
		color: TEXT_TITLE_GREY,
	},

	categoryBanner: {
		backgroundColor: BACKGROUND_ALT_BLUE_FRANCE,
		paddingHorizontal: 8,
		paddingVertical: 4,
		marginTop: 10,
	},
	categoryBannerText: {
		fontSize: 9,
		fontWeight: BOLD,
		color: TEXT_TITLE_GREY,
	},

	subTitle: {
		fontSize: 9,
		fontWeight: BOLD,
		color: TEXT_TITLE_GREY,
		marginTop: 10,
	},

	infoBody: {
		flexDirection: "row",
		paddingHorizontal: 8,
		paddingVertical: 6,
	},
	infoLabelColumn: {
		width: 142,
	},
	infoValueColumn: {
		flex: 1,
	},
	infoLabel: {
		fontSize: 9,
		color: TEXT_TITLE_GREY,
		marginBottom: 4,
	},
	infoValue: {
		fontSize: 9,
		fontWeight: BOLD,
		color: TEXT_TITLE_GREY,
		marginBottom: 4,
	},

	table: {
		borderTopWidth: 1,
		borderLeftWidth: 1,
		borderColor: BORDER_CONTRAST_GREY,
		marginTop: 4,
	},
	row: {
		flexDirection: "row",
	},
	cell: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		minHeight: 24,
		borderRightWidth: 1,
		borderBottomWidth: 1,
		borderColor: BORDER_CONTRAST_GREY,
		justifyContent: "center",
		backgroundColor: WHITE,
	},
	headerCell: {
		backgroundColor: BACKGROUND_ALT_GREY,
	},
	cellText: {
		fontSize: 9,
		color: TEXT_DEFAULT_GREY,
	},
	cellTextBold: {
		fontSize: 9,
		fontWeight: BOLD,
		color: TEXT_DEFAULT_GREY,
	},
	headerHint: {
		fontSize: 9,
		fontWeight: REGULAR,
		color: TEXT_DEFAULT_GREY,
		marginTop: 2,
	},

	gapCell: {
		flexDirection: "row",
		alignItems: "center",
	},
	gapValue: {
		flex: 1,
		fontSize: 9,
		fontWeight: BOLD,
		color: TEXT_DEFAULT_GREY,
		textAlign: "right",
	},
	badge: {
		backgroundColor: BACKGROUND_CONTRAST_WARNING,
		borderRadius: 2,
		paddingHorizontal: 3,
		paddingVertical: 1,
	},
	badgeText: {
		fontSize: 8,
		fontWeight: BOLD,
		color: TEXT_DEFAULT_WARNING,
	},

	noData: {
		fontSize: 9,
		color: TEXT_DEFAULT_GREY,
		fontStyle: "italic",
		marginTop: 4,
	},

	categoryBlock: {
		marginBottom: 2,
	},
});
