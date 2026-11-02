import { Text, View } from "@react-pdf/renderer";

import { type PdfStyles, styles } from "../recapPdfStyles";

export function SectionBanner({
	title,
	sheet = styles,
}: {
	title: string;
	sheet?: PdfStyles;
}) {
	return (
		<View style={sheet.sectionBanner}>
			<Text style={sheet.sectionBannerText}>{title}</Text>
		</View>
	);
}

export function CategoryBanner({ title }: { title: string }) {
	return (
		<View style={styles.categoryBanner}>
			<Text style={styles.categoryBannerText}>{title}</Text>
		</View>
	);
}

export function SubTitle({ title }: { title: string }) {
	return (
		<Text minPresenceAhead={40} style={styles.subTitle}>
			{title}
		</Text>
	);
}
