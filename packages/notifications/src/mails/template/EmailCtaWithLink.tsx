import { EmailButton } from "./EmailButton.js";
import { COLORS, FONT, SPACING } from "./tokens.js";

type EmailCtaWithLinkProps = {
	href: string;
	label: string;
};

const SPACER = {
	height: SPACING.md,
	lineHeight: `${SPACING.md}px`,
	fontSize: SPACING.md,
} as const;

export function EmailCtaWithLink({ href, label }: EmailCtaWithLinkProps) {
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
					<td style={SPACER}>&nbsp;</td>
				</tr>
				<tr>
					<td>
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
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: COLORS.blueFrance, textDecoration: "underline" }}
						>
							{href}
						</a>
					</td>
				</tr>
			</tbody>
		</table>
	);
}
