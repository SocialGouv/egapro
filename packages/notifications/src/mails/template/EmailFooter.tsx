import { getPublicUrl } from "../shared/urls.js";
import { EmailFrameRow } from "./EmailFrameRow.js";
import { MarianneLogoBlock } from "./MarianneLogoBlock.js";
import { COLORS, FONT } from "./tokens.js";

const DREETS_MAIL = "dreets@travail.gouv.fr";
const REFERENT_MAIL = "referent-egalite@dreets.gouv.fr";

type EmailFooterProps = {
	referentMail?: string;
};

export function EmailFooter({
	referentMail = REFERENT_MAIL,
}: EmailFooterProps) {
	const personalDataUrl = `${getPublicUrl()}/web/donnees-personnelles`;
	const mention = {
		margin: 0,
		fontFamily: FONT.family,
		fontSize: FONT.size.sm,
		lineHeight: FONT.lineHeight.sm,
		color: COLORS.footerGrey,
	} as const;
	const link = {
		color: COLORS.blueFrance,
		textDecoration: "underline",
	} as const;
	return (
		<>
			<EmailFrameRow edge="bottom" gradient>
				<tr>
					<td
						style={{
							paddingTop: 20,
							paddingBottom: 20,
							borderTop: `1px solid ${COLORS.frameBorder}`,
						}}
					>
						<MarianneLogoBlock />
					</td>
				</tr>
			</EmailFrameRow>
			<EmailFrameRow bordered={false}>
				<tr>
					<td style={{ padding: "20px 10px" }}>
						<p style={mention}>
							Ce courriel est envoyé automatiquement. Merci de ne pas y
							répondre. Pour toute question, vous pouvez joindre votre référent
							égalité professionnelle :{" "}
							<a href={`mailto:${referentMail}`} style={link}>
								{referentMail}
							</a>
						</p>
						<p style={{ ...mention, marginTop: 8 }}>
							Si les données personnelles mentionnées vous concernent, vous
							disposez d'un droit d'accès, de rectification, de limitation et
							d'opposition (RGPD). Pour l'exercer :{" "}
							<a href={`mailto:${DREETS_MAIL}`} style={link}>
								{DREETS_MAIL}
							</a>
							. Pour en savoir plus :{" "}
							<a href={personalDataUrl} style={link}>
								{personalDataUrl}
							</a>
						</p>
					</td>
				</tr>
			</EmailFrameRow>
		</>
	);
}
