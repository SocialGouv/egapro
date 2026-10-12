import { Text, View } from "@react-pdf/renderer";

import { GAP_FAVORED_SEX_MENTIONS } from "~/modules/declaration-remuneration";
import {
	formatGap,
	gapFavoredSex,
	gapLevel,
	gapMagnitude,
} from "~/modules/domain";

import { type PdfStyles, styles } from "../recapPdfStyles";

export type GapCellVariant = "signed" | "favoredSex";

function HighBadge({ sheet }: { sheet: PdfStyles }) {
	return (
		<View style={sheet.badge}>
			<Text style={sheet.badgeText}>ÉLEVÉ</Text>
		</View>
	);
}

function FavoredSexGap({
	gap,
	sheet,
}: {
	gap: number | null;
	sheet: PdfStyles;
}) {
	const favoredSex = gapFavoredSex(gap);
	return (
		<View>
			<View style={sheet.gapMagnitudeRow}>
				<Text style={sheet.gapMagnitude}>{formatGap(gapMagnitude(gap))}</Text>
				{gapLevel(gap) === "high" ? <HighBadge sheet={sheet} /> : null}
			</View>
			{favoredSex ? (
				<Text style={sheet.gapFavoredSex}>
					{GAP_FAVORED_SEX_MENTIONS[favoredSex]}
				</Text>
			) : null}
		</View>
	);
}

export function GapCell({
	gap,
	variant = "signed",
	sheet = styles,
}: {
	gap: number | null;
	variant?: GapCellVariant;
	sheet?: PdfStyles;
}) {
	if (variant === "favoredSex")
		return <FavoredSexGap gap={gap} sheet={sheet} />;
	// No "faible" badge in the maquette — only "ÉLEVÉ", by absolute gap magnitude.
	const isHigh = gapLevel(gap) === "high";
	return (
		<View style={sheet.gapCell}>
			{isHigh ? <HighBadge sheet={sheet} /> : null}
			<Text style={sheet.gapValue}>{formatGap(gap)}</Text>
		</View>
	);
}
