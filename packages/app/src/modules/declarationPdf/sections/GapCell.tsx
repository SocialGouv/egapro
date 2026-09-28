import { Text, View } from "@react-pdf/renderer";

import { formatGap, gapLevel } from "~/modules/domain";

import { styles } from "../recapPdfStyles";

export function GapCell({ gap }: { gap: number | null }) {
	// No "faible" badge in the maquette — only "ÉLEVÉ", by absolute gap magnitude.
	const isHigh = gapLevel(gap) === "high";
	return (
		<View style={styles.gapCell}>
			{isHigh ? (
				<View style={styles.badge}>
					<Text style={styles.badgeText}>ÉLEVÉ</Text>
				</View>
			) : null}
			<Text style={styles.gapValue}>{formatGap(gap)}</Text>
		</View>
	);
}
