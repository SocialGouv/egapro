import { Section } from "@react-email/components";
import { BlocMarque } from "./BlocMarque.js";
import { BORDER, BRAND, COLORS, FONT, LAYOUT, SPACING } from "./tokens.js";

type EmailHeaderProps = {
	directionName?: string;
};

export function EmailHeader({
	directionName = BRAND.directionName,
}: EmailHeaderProps) {
	return (
		<Section
			style={{
				padding: `${SPACING.lg}px ${LAYOUT.headerPaddingX}px`,
				borderBottom: BORDER.thin,
				backgroundColor: COLORS.bgWhite,
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
						<td align="left" style={{ verticalAlign: "top", padding: 0 }}>
							<BlocMarque />
						</td>
						<td
							align="right"
							style={{
								verticalAlign: "top",
								fontFamily: FONT.family,
								fontSize: FONT.size.sm,
								fontWeight: FONT.weight.bold,
								color: COLORS.textTitle,
								lineHeight: FONT.lineHeight.sm,
							}}
						>
							{directionName}
						</td>
					</tr>
				</tbody>
			</table>
		</Section>
	);
}
