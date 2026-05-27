import { Button } from "@react-email/components";
import { COLORS, FONT, SPACING } from "./tokens.js";

type EmailButtonProps = {
	href: string;
	label: string;
};

export function EmailButton({ href, label }: EmailButtonProps) {
	return (
		<Button
			href={href}
			style={{
				display: "inline-block",
				padding: `${SPACING.md - 4}px ${SPACING.lg}px`,
				backgroundColor: COLORS.blueFrance,
				color: COLORS.bgWhite,
				fontFamily: FONT.family,
				fontSize: FONT.size.bodyMd,
				fontWeight: FONT.weight.medium,
				lineHeight: FONT.lineHeight.bodyMd,
				textDecoration: "none",
				textAlign: "center",
			}}
		>
			{label}
		</Button>
	);
}
