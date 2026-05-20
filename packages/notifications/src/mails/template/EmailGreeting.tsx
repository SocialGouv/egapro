import type { ReactNode } from "react";
import { COLORS, FONT, SPACING } from "./tokens.js";

type EmailGreetingProps = {
	children: ReactNode;
};

export function EmailGreeting({ children }: EmailGreetingProps) {
	return (
		<p
			style={{
				margin: 0,
				marginBottom: SPACING.md,
				fontFamily: FONT.family,
				fontSize: FONT.size.body,
				fontWeight: FONT.weight.bold,
				lineHeight: FONT.lineHeight.body,
				color: COLORS.textTitle,
			}}
		>
			{children}
		</p>
	);
}
