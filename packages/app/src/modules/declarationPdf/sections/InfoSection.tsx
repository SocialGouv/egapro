import { Text, View } from "@react-pdf/renderer";

import { type PdfStyles, styles } from "../recapPdfStyles";
import { pdfHeading, pdfTag } from "../tagging/pdfStructure";
import { normalizePdfText } from "./tableParts";

type InfoRow = {
	label: string;
	value: string;
	detail?: string;
};

type BannerTone = "section" | "category";

export function InfoRow({
	label,
	value,
	detail,
	sheet = styles,
}: InfoRow & { sheet?: PdfStyles }) {
	return (
		<View {...pdfTag("LI")} style={sheet.infoRow}>
			<Text {...pdfTag("Lbl")} style={[sheet.infoLabelColumn, sheet.infoLabel]}>
				{label}
			</Text>
			<Text
				{...pdfTag("LBody")}
				style={[sheet.infoValueColumn, sheet.infoValue]}
			>
				{normalizePdfText(value)}
				{detail !== undefined && (
					<Text style={sheet.infoDetail}>
						{`\n${normalizePdfText(detail)}`}
					</Text>
				)}
			</Text>
		</View>
	);
}

export function InfoSection({
	title,
	rows,
	sheet = styles,
	tone = "section",
}: {
	title: string;
	rows: InfoRow[];
	sheet?: PdfStyles;
	tone?: BannerTone;
}) {
	const isCategory = tone === "category";
	return (
		<View {...pdfTag("Sect")} wrap={false}>
			<View style={isCategory ? sheet.categoryBanner : sheet.sectionBanner}>
				<Text
					{...pdfHeading(isCategory ? 3 : 2)}
					style={
						isCategory ? sheet.categoryBannerText : sheet.sectionBannerText
					}
				>
					{title}
				</Text>
			</View>
			<View {...pdfTag("L")} style={sheet.infoBody}>
				{rows.map((row) => (
					<InfoRow
						detail={row.detail}
						key={row.label}
						label={row.label}
						sheet={sheet}
						value={row.value}
					/>
				))}
			</View>
		</View>
	);
}
