import { Text, View } from "@react-pdf/renderer";

import { styles } from "../recapPdfStyles";

export function SectionBanner({ title }: { title: string }) {
	return (
		<View style={styles.sectionBanner}>
			<Text style={styles.sectionBannerText}>{title}</Text>
		</View>
	);
}

export function CategoryBanner({ title }: { title: string }) {
	return (
		<View minPresenceAhead={60} style={styles.categoryBanner}>
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
