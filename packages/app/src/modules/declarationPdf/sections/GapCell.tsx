import { Text, View } from "@react-pdf/renderer";

import { formatGap, isSignificantGap } from "~/modules/domain";

import { styles } from "../recapPdfStyles";

export function GapCell({ gap }: { gap: number | null }) {
	// The maquette badges any gap whose magnitude reaches the 5% regulatory
	// threshold, in either direction (a −5,90 % gap is badged). No "faible"
	// badge exists — only "ÉLEVÉ".
	const isHigh = isSignificantGap(gap);
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
