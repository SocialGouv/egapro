import { EmailButton } from "./EmailButton.js";
import { COLORS, FONT, SPACING } from "./tokens.js";

type EmailCtaWithLinkProps = {
	href: string;
	label: string;
};

export function EmailCtaWithLink({ href, label }: EmailCtaWithLinkProps) {
	return (
		<>
			<EmailButton href={href} label={label} />
			<p
				style={{
					margin: 0,
					marginTop: SPACING.sm,
					fontFamily: FONT.family,
					fontSize: FONT.size.sm,
					lineHeight: FONT.lineHeight.sm,
				}}
			>
				<a
					href={href}
					style={{
						color: COLORS.blueFrance,
						textDecoration: "underline",
					}}
				>
					{href}
				</a>
			</p>
		</>
	);
}
