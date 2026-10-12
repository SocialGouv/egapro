import { Text, View } from "@react-pdf/renderer";

import { GAP_FAVORED_SEX_MENTIONS } from "~/modules/declaration-remuneration";
import {
	formatGap,
	gapFavoredSex,
	gapLevel,
	gapMagnitude,
} from "~/modules/domain";

import { usePdfStyles } from "./pdfStylesContext";

export type GapCellVariant = "signed" | "favoredSex";

function HighBadge() {
	const styles = usePdfStyles();
	return (
		<View style={styles.badge}>
			<Text style={styles.badgeText}>ÉLEVÉ</Text>
		</View>
	);
}

function FavoredSexGap({ gap }: { gap: number | null }) {
	const styles = usePdfStyles();
	const favoredSex = gapFavoredSex(gap);
	return (
		<View>
			<View style={styles.gapMagnitudeRow}>
				<Text style={styles.gapMagnitude}>{formatGap(gapMagnitude(gap))}</Text>
				{gapLevel(gap) === "high" ? <HighBadge /> : null}
			</View>
			{favoredSex ? (
				<Text style={styles.gapFavoredSex}>
					{GAP_FAVORED_SEX_MENTIONS[favoredSex]}
				</Text>
			) : null}
		</View>
	);
}

export function GapCell({
	gap,
	variant = "signed",
}: {
	gap: number | null;
	variant?: GapCellVariant;
}) {
	const styles = usePdfStyles();
	if (variant === "favoredSex") return <FavoredSexGap gap={gap} />;
	// No "faible" badge in the maquette — only "ÉLEVÉ", by absolute gap magnitude.
	const isHigh = gapLevel(gap) === "high";
	return (
		<View style={styles.gapCell}>
			{isHigh ? <HighBadge /> : null}
			<Text style={styles.gapValue}>{formatGap(gap)}</Text>
		</View>
	);
}
