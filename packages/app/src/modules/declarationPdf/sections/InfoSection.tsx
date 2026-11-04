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
					<View {...pdfTag("LI")} key={row.label} style={sheet.infoRow}>
						<Text
							{...pdfTag("Lbl")}
							style={[sheet.infoLabelColumn, sheet.infoLabel]}
						>
							{row.label}
						</Text>
						<Text
							{...pdfTag("LBody")}
							style={[sheet.infoValueColumn, sheet.infoValue]}
						>
							{normalizePdfText(row.value)}
							{row.detail !== undefined && (
								<Text style={sheet.infoDetail}>
									{`\n${normalizePdfText(row.detail)}`}
								</Text>
							)}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}
