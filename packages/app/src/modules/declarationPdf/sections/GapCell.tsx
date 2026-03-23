import { Text, View } from "@react-pdf/renderer";

import { formatGap, gapLevel } from "~/modules/domain";

import { styles } from "../pdfStyles";

export function GapCell({ gap }: { gap: number | null }) {
	const level = gapLevel(gap);
	return (
		<View style={[styles.tableCellGap, styles.badgeRow]}>
			<Text>{formatGap(gap)}</Text>
			{level && (
				<Text
					style={[
						styles.badge,
						level === "low" ? styles.badgeLow : styles.badgeHigh,
					]}
				>
					{level === "low" ? "faible" : "élevé"}
				</Text>
			)}
		</View>
	);
}
