import { Text, View } from "@react-pdf/renderer";

import { type PdfStyles, styles } from "../recapPdfStyles";
import { pdfHeading } from "../tagging/pdfStructure";

type HeadingLevel = 2 | 3 | 4;

export function SectionBanner({
	title,
	sheet = styles,
}: {
	title: string;
	sheet?: PdfStyles;
}) {
	return (
		<View style={sheet.sectionBanner}>
			<Text {...pdfHeading(2)} style={sheet.sectionBannerText}>
				{title}
			</Text>
		</View>
	);
}

export function CategoryBanner({ title }: { title: string }) {
	return (
		<View style={styles.categoryBanner}>
			<Text {...pdfHeading(3)} style={styles.categoryBannerText}>
				{title}
			</Text>
		</View>
	);
}

export function SubTitle({
	title,
	level = 3,
}: {
	title: string;
	level?: HeadingLevel;
}) {
	return (
		<Text {...pdfHeading(level)} minPresenceAhead={40} style={styles.subTitle}>
			{title}
		</Text>
	);
}
