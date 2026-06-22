import type { ReactNode } from "react";
import { COLORS, FONT, SPACING } from "./tokens.js";

type EmailParagraphProps = {
	children: ReactNode;
	emphasis?: "default" | "muted";
	noMarginBottom?: boolean;
};

export function EmailParagraph({
	children,
	emphasis = "default",
	noMarginBottom = false,
}: EmailParagraphProps) {
	const color = emphasis === "muted" ? COLORS.textGrey : COLORS.textDefault;
	return (
		<p
			style={{
				margin: 0,
				marginBottom: noMarginBottom ? 0 : SPACING.md,
				fontFamily: FONT.family,
				fontSize: FONT.size.body,
				lineHeight: FONT.lineHeight.body,
				color,
			}}
		>
			{children}
		</p>
	);
}
