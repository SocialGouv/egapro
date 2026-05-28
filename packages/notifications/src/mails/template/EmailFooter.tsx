import { Hr, Section } from "@react-email/components";
import { getPublicUrl } from "../shared/urls.js";
import { BlocMarque } from "./BlocMarque.js";
import { BORDER, BRAND, COLORS, FONT, LAYOUT, SPACING } from "./tokens.js";

type EmailFooterProps = {
	directionName?: string;
	referentMailLabel?: string;
};

const DREETS_MAIL = "dreets@travail.gouv.fr";

export function EmailFooter({
	directionName = BRAND.directionName,
	referentMailLabel = "[Mail du référent départemental]",
}: EmailFooterProps) {
	const publicUrl = getPublicUrl();
	const personalDataUrl = `${publicUrl}/web/donnees-personnelles`;
	return (
		<>
			<Section
				style={{
					padding: `${SPACING.lg}px ${LAYOUT.headerPaddingX}px`,
					backgroundColor: COLORS.bgWhite,
					borderTop: BORDER.thin,
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
			<Hr style={{ margin: 0, borderColor: COLORS.border }} />
			<Section
				style={{
					padding: `${SPACING.md}px ${LAYOUT.headerPaddingX}px ${SPACING.lg}px`,
					backgroundColor: COLORS.bgWhite,
				}}
			>
				<p
					style={{
						margin: 0,
						fontFamily: FONT.family,
						fontSize: FONT.size.sm,
						lineHeight: FONT.lineHeight.sm,
						color: COLORS.textGrey,
					}}
				>
					Ce courriel est envoyé automatiquement. Merci de ne pas y répondre.
					Pour toute question, vous pouvez joindre votre référent égalité
					professionnelle : {referentMailLabel}
				</p>
				<p
					style={{
						margin: `${SPACING.sm}px 0 0`,
						fontFamily: FONT.family,
						fontSize: FONT.size.sm,
						lineHeight: FONT.lineHeight.sm,
						color: COLORS.textGrey,
					}}
				>
					Si les données personnelles mentionnées vous concernent, vous disposez
					d'un droit d'accès, de rectification, de limitation et d'opposition
					(RGPD). Pour l'exercer :{" "}
					<a
						href={`mailto:${DREETS_MAIL}`}
						style={{ color: COLORS.blueFrance, textDecoration: "underline" }}
					>
						{DREETS_MAIL}
					</a>
					. Pour en savoir plus :{" "}
					<a
						href={personalDataUrl}
						style={{ color: COLORS.blueFrance, textDecoration: "underline" }}
					>
						{personalDataUrl}
					</a>
				</p>
			</Section>
		</>
	);
}
