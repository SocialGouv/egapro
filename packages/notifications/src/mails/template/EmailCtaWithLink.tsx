import { EmailButton } from "./EmailButton.js";
import { COLORS, FONT, SPACING } from "./tokens.js";

type EmailCtaWithLinkProps = {
	href: string;
	label: string;
	linkHref?: string;
};

export function EmailCtaWithLink({
	href,
	label,
	linkHref,
}: EmailCtaWithLinkProps) {
	const displayedLink = linkHref ?? href;
	return (
		<table
			role="presentation"
			width="100%"
			cellSpacing={0}
			cellPadding={0}
			border={0}
			style={{ borderCollapse: "collapse", width: "100%" }}
		>
			<tbody>
				<tr>
					<td align="center">
						<EmailButton href={href} label={label} />
					</td>
				</tr>
				<tr>
					<td
						style={{
							paddingTop: SPACING.md,
							paddingBottom: SPACING.lg,
							fontFamily: FONT.family,
							fontSize: FONT.size.sm,
							lineHeight: FONT.lineHeight.cta,
						}}
					>
						<a
							href={displayedLink}
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: COLORS.blueFrance, textDecoration: "underline" }}
						>
							{displayedLink}
						</a>
					</td>
				</tr>
			</tbody>
		</table>
	);
}
