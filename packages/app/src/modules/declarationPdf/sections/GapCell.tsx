import { Text, View } from "@react-pdf/renderer";

import { GAP_FAVORED_SEX_MENTIONS } from "~/modules/declaration-remuneration/shared/gapBadge";
import {
	formatGap,
	gapFavoredSex,
	gapLevel,
	gapMagnitude,
} from "~/modules/domain";

import { styles } from "../recapPdfStyles";

export function GapCell({ gap }: { gap: number | null }) {
	// No "faible" badge in the maquette — only "ÉLEVÉ", by absolute gap magnitude.
	const isHigh = gapLevel(gap) === "high";
	const favoredSex = gapFavoredSex(gap);
	return (
		<View style={styles.gapCell}>
			<View style={styles.gapValueRow}>
				{isHigh ? (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>ÉLEVÉ</Text>
					</View>
				) : null}
				<Text style={styles.gapValue}>{formatGap(gapMagnitude(gap))}</Text>
			</View>
			{favoredSex && (
				<Text style={styles.gapDirection}>
					{GAP_FAVORED_SEX_MENTIONS[favoredSex]}
				</Text>
			)}
		</View>
	);
}
