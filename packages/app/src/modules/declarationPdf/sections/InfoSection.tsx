import { Text, View } from "@react-pdf/renderer";

import { type PdfStyles, styles } from "../recapPdfStyles";
import { normalizeSpaces } from "./tableParts";

type InfoRow = {
	label: string;
	value: string;
	detail?: string;
};

type BannerTone = "section" | "category";

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
		<View wrap={false}>
			<View style={isCategory ? sheet.categoryBanner : sheet.sectionBanner}>
				<Text
					style={
						isCategory ? sheet.categoryBannerText : sheet.sectionBannerText
					}
				>
					{title}
				</Text>
			</View>
			<View style={sheet.infoBody}>
				{rows.map((row) => (
					<View key={row.label} style={sheet.infoRow}>
						<Text style={[sheet.infoLabelColumn, sheet.infoLabel]}>
							{row.label}
						</Text>
						<Text style={[sheet.infoValueColumn, sheet.infoValue]}>
							{normalizeSpaces(row.value)}
							{row.detail !== undefined && (
								<Text style={sheet.infoDetail}>
									{`\n${normalizeSpaces(row.detail)}`}
								</Text>
							)}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}
