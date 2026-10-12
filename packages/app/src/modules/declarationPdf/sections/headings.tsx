import { Text, View } from "@react-pdf/renderer";

import { usePdfStyles } from "./pdfStylesContext";

export function SectionBanner({ title }: { title: string }) {
	const styles = usePdfStyles();
	return (
		<View style={styles.sectionBanner}>
			<Text style={styles.sectionBannerText}>{title}</Text>
		</View>
	);
}

export function CategoryBanner({ title }: { title: string }) {
	const styles = usePdfStyles();
	return (
		<View style={styles.categoryBanner}>
			<Text style={styles.categoryBannerText}>{title}</Text>
		</View>
	);
}

export function SubTitle({ title }: { title: string }) {
	const styles = usePdfStyles();
	return (
		<Text minPresenceAhead={40} style={styles.subTitle}>
			{title}
		</Text>
	);
}
