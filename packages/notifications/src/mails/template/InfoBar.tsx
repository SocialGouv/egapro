import { Section } from "@react-email/components";
import { BRAND, COLORS, FONT, LAYOUT, SPACING } from "./tokens.js";

type InfoBarProps = {
	title?: string;
	baseline?: string;
};

// Pictogramme récépissé (document avec lignes) — DSFR fr-icon-file-text-line,
// extrait depuis packages/app/public/dsfr/icons/document/file-text-line.svg.
function ReceiptIcon() {
	return (
		<svg
			width="32"
			height="32"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			role="presentation"
			aria-hidden="true"
			style={{ display: "block" }}
		>
			<title>Récépissé</title>
			<path
				fill={COLORS.blueFrance}
				d="M14.997 2 21 8v12.993A1 1 0 0 1 20.007 22H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.449 2 4.002 2h10.995ZM14 4H5v16h14V9h-5V4ZM8 7h3v2H8V7Zm0 4h8v2H8v-2Zm0 4h8v2H8v-2Z"
			/>
		</svg>
	);
}

export function InfoBar({
	title = BRAND.serviceTitle,
	baseline = BRAND.serviceBaseline,
}: InfoBarProps) {
	return (
		<Section
			style={{
				backgroundColor: COLORS.bgAltBlueFrance,
				padding: `${SPACING.lg}px ${LAYOUT.headerPaddingX}px`,
			}}
		>
			<table
				role="presentation"
				cellSpacing={0}
				cellPadding={0}
				border={0}
				width="100%"
				style={{ borderCollapse: "collapse" }}
			>
				<tbody>
					<tr>
						<td style={{ verticalAlign: "middle", padding: 0 }}>
							<div
								style={{
									fontFamily: FONT.family,
									fontSize: FONT.size.h5,
									fontWeight: FONT.weight.bold,
									color: COLORS.textTitle,
									lineHeight: FONT.lineHeight.h5,
								}}
							>
								{title}
							</div>
							<div
								style={{
									fontFamily: FONT.family,
									fontSize: FONT.size.sm,
									fontWeight: FONT.weight.regular,
									color: COLORS.textTitle,
									lineHeight: FONT.lineHeight.sm,
									marginTop: SPACING.xs,
								}}
							>
								{baseline}
							</div>
						</td>
						<td
							align="right"
							style={{
								verticalAlign: "middle",
								width: 32,
								paddingLeft: SPACING.md,
							}}
						>
							<ReceiptIcon />
						</td>
					</tr>
				</tbody>
			</table>
		</Section>
	);
}
