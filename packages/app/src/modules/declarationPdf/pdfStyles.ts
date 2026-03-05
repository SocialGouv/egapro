import { StyleSheet } from "@react-pdf/renderer";

const BLUE_FRANCE = "#000091";
const BLUE_FRANCE_LIGHT = "#E3E3FD";
const GREY_BG = "#F6F6F6";
const GREY_BORDER = "#E5E5E5";
const GREY_TEXT = "#666666";
const WARNING_BG = "#FFE9E6";
const WARNING_TEXT = "#CE0500";

export const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontFamily: "Helvetica",
		fontSize: 10,
		color: "#161616",
	},
	header: {
		marginBottom: 20,
	},
	title: {
		fontSize: 16,
		fontFamily: "Helvetica-Bold",
		color: BLUE_FRANCE,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 11,
		color: GREY_TEXT,
		marginBottom: 8,
	},
	companyInfo: {
		fontSize: 10,
		marginBottom: 2,
	},
	card: {
		backgroundColor: GREY_BG,
		border: `1 solid ${GREY_BORDER}`,
		borderRadius: 4,
		padding: 12,
		marginBottom: 10,
	},
	cardTitle: {
		fontSize: 11,
		fontFamily: "Helvetica-Bold",
		marginBottom: 8,
	},
	tableRow: {
		flexDirection: "row",
		borderBottom: `1 solid ${GREY_BORDER}`,
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
		backgroundColor: BLUE_FRANCE_LIGHT,
		paddingVertical: 4,
		paddingHorizontal: 2,
		borderRadius: 2,
		marginBottom: 2,
	},
	tableHeaderText: {
		fontSize: 8,
		fontFamily: "Helvetica-Bold",
		color: BLUE_FRANCE,
	},
	tableCellLabel: {
		flex: 3,
		fontSize: 9,
	},
	tableCellLabelBold: {
		flex: 3,
		fontSize: 9,
		fontFamily: "Helvetica-Bold",
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
		fontFamily: "Helvetica-Bold",
	},
	tableCellGap: {
		flex: 2,
		fontSize: 9,
		textAlign: "right",
		fontFamily: "Helvetica-Bold",
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
		backgroundColor: BLUE_FRANCE_LIGHT,
		color: BLUE_FRANCE,
	},
	badgeHigh: {
		backgroundColor: WARNING_BG,
		color: WARNING_TEXT,
	},
	sectionLabel: {
		fontSize: 9,
		fontFamily: "Helvetica-Bold",
		marginBottom: 4,
		marginTop: 6,
	},
	noData: {
		fontSize: 9,
		color: GREY_TEXT,
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
		color: GREY_TEXT,
		marginBottom: 2,
	},
	proportionValue: {
		fontSize: 10,
		fontFamily: "Helvetica-Bold",
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
		color: GREY_TEXT,
		textAlign: "center",
	},
});
