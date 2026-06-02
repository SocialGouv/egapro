import { getImageUrl } from "../shared/urls.js";
import { EmailFrameRow } from "./EmailFrameRow.js";
import { BRAND, COLORS, FONT, LAYOUT } from "./tokens.js";

// DSFR "En-tête - Illustration" band: title + tagline on the left, egapro icon
// on the right, over the #ECECFE band. Title and icon share a single two-cell
// row, both vertically centered, so the icon stays aligned with the text block.
// The icon is a raster PNG — Gmail and Outlook strip <img src="*.svg">.
const ICON = getImageUrl("icon@2x.png");

const BAND_CELL = { backgroundColor: COLORS.bgIllustration } as const;

type EmailIllustrationProps = {
	title?: string;
};

export function EmailIllustration({
	title = BRAND.serviceTitle,
}: EmailIllustrationProps) {
	return (
		<EmailFrameRow gradient background={COLORS.bgIllustration}>
			<tr>
				<td style={BAND_CELL}>
					<table
						role="presentation"
						width="100%"
						cellSpacing={0}
						cellPadding={0}
						border={0}
						style={{ borderCollapse: "collapse", width: "100%", ...BAND_CELL }}
					>
						<tbody>
							<tr>
								<td
									align="left"
									style={{
										verticalAlign: "middle",
										padding: "40px 10px",
										...BAND_CELL,
									}}
								>
									<div
										style={{
											fontFamily: FONT.family,
											fontSize: FONT.size.title,
											fontWeight: FONT.weight.bold,
											lineHeight: FONT.lineHeight.title,
											color: COLORS.textTitle,
										}}
									>
										{title}
									</div>
									<div
										style={{
											marginTop: 4,
											fontFamily: FONT.family,
											fontSize: FONT.size.sm,
											lineHeight: FONT.lineHeight.sm,
											color: COLORS.textMention,
										}}
									>
										Indicateurs d'égalité professionnelle femmes‑hommes
									</div>
								</td>
								<td
									align="center"
									width={LAYOUT.illustrationImageWidth}
									style={{
										verticalAlign: "middle",
										width: LAYOUT.illustrationImageWidth,
										...BAND_CELL,
									}}
								>
									<img
										src={ICON}
										width={100}
										alt={BRAND.illustrationAlt}
										style={{ display: "block", margin: "0 auto" }}
									/>
								</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
		</EmailFrameRow>
	);
}
